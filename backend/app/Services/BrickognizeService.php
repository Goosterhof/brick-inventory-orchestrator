<?php

declare(strict_types = 1);

namespace App\Services;

use App\Contracts\BrickIdentificationServiceInterface;
use App\DataTransferObjects\Input\Brickognize\BrickognizePredictionData;
use App\Exceptions\BrickognizeApiException;
use App\Exceptions\InvalidApiResponseException;
use Illuminate\Container\Attributes\Config;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;

use function array_key_exists;
use function ctype_digit;
use function is_array;
use function min;
use function sprintf;

final readonly class BrickognizeService implements BrickIdentificationServiceInterface
{
    private const array PREDICTION_REQUIRED_FIELDS = ['id', 'name', 'type', 'score'];

    private const int RETRY_TIMES = 3;

    private const int RETRY_DELAY_MS = 100;

    private const int RATE_LIMIT_DEFAULT_DELAY_SECONDS = 1;

    private const int RATE_LIMIT_MAX_DELAY_SECONDS = 60;

    public function __construct(
        private HttpFactory $httpFactory,
        #[Config('services.brickognize.base_url', 'https://api.brickognize.com')]
        private string $baseUrl,
    ) {}

    /**
     * Identify a LEGO brick from an uploaded image.
     *
     * @throws BrickognizeApiException
     * @throws InvalidApiResponseException
     *
     * @return list<BrickognizePredictionData>
     */
    public function identifyBrick(UploadedFile $uploadedFile): array
    {
        $response = $this->httpClient()
            ->attach('query_image', $uploadedFile->getContent(), $uploadedFile->getClientOriginalName())
            ->post('/predict/');

        if ($response->failed()) {
            throw BrickognizeApiException::fromResponse($response, 'Failed to identify brick');
        }

        $data = $response->json();

        $this->validateResponse($data);

        /** @var array{items: list<array{id: string, name: string, type: string, img_url?: string|null, score: float|int}>} $data */
        $predictions = [];
        foreach ($data['items'] as $item) {
            $predictions[] = new BrickognizePredictionData(
                id: $item['id'],
                name: $item['name'],
                type: $item['type'],
                imageUrl: $item['img_url'] ?? null,
                score: (float) $item['score'],
            );
        }

        return $predictions;
    }

    private function httpClient(): PendingRequest
    {
        return $this->httpFactory->baseUrl($this->baseUrl)
            ->acceptJson()
            ->timeout(30)
            ->retry(
                self::RETRY_TIMES,
                fn(int $attempt, mixed $exception): int => $this->retryDelayInMilliseconds($exception),
                throw: false,
            );
    }

    /**
     * Compute the backoff before the next retry attempt. A 429 honours the upstream
     * Retry-After header (seconds form, capped at RATE_LIMIT_MAX_DELAY_SECONDS); a missing
     * or non-numeric header (e.g. HTTP-date form) falls back to a bounded default.
     * Every other failure keeps the fixed RETRY_DELAY_MS backoff.
     */
    private function retryDelayInMilliseconds(mixed $exception): int
    {
        if (!$exception instanceof RequestException || $exception->response->status() !== 429) {
            return self::RETRY_DELAY_MS;
        }

        $retryAfter = $exception->response->header('Retry-After');

        if (!ctype_digit($retryAfter)) {
            return self::RATE_LIMIT_DEFAULT_DELAY_SECONDS * 1_000;
        }

        return min((int) $retryAfter, self::RATE_LIMIT_MAX_DELAY_SECONDS) * 1_000;
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validateResponse(mixed $data): void
    {
        if (!is_array($data)) {
            throw InvalidApiResponseException::invalidStructure('Identifying brick', 'Expected array response');
        }

        if (!array_key_exists('items', $data) || !is_array($data['items'])) {
            throw InvalidApiResponseException::invalidStructure('Identifying brick', "Missing or invalid 'items' field");
        }

        foreach ($data['items'] as $index => $item) {
            $this->validatePredictionItem($item, $index);
        }
    }

    /**
     * @throws InvalidApiResponseException
     */
    private function validatePredictionItem(mixed $item, int $index): void
    {
        if (!is_array($item)) {
            throw InvalidApiResponseException::invalidStructure('Identifying brick', sprintf('Prediction at index %d is not an array', $index));
        }

        $missingFields = [];
        foreach (self::PREDICTION_REQUIRED_FIELDS as $field) {
            if (!array_key_exists($field, $item)) {
                $missingFields[] = $field;
            }
        }

        if ($missingFields !== []) {
            throw InvalidApiResponseException::missingFields($missingFields, sprintf('Prediction at index %d', $index));
        }
    }
}
