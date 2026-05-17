<?php

declare(strict_types = 1);

namespace App\Http\Requests\StorageOption;

use App\DataTransferObjects\Input\StorageOption\StorageOptionData;
use App\Models\StorageOption;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

use function is_int;
use function is_string;
use function sprintf;

final class StorageOptionRequest extends FormRequest
{
    private const string NAME = 'name';

    private const string DESCRIPTION = 'description';

    private const string PARENT_ID = 'parent_id';

    private const string ROW = 'row';

    private const string COLUMN = 'column';

    private const string GRID_ROWS = 'grid_rows';

    private const string GRID_COLUMNS = 'grid_columns';

    /**
     * @return array<string, array<int, string|Closure>>
     */
    public function rules(): array
    {
        return [
            self::NAME => ['required', 'string', 'max:255'],
            self::DESCRIPTION => ['nullable', 'string', 'max:65535'],
            self::PARENT_ID => ['nullable', 'integer', 'exists:storage_options,id', function(string $attribute, mixed $value, Closure $fail): void {
                /** @var User $user */
                $user = $this->user();
                /** @var StorageOption|null $parentOption */
                $parentOption = StorageOption::query()->find($value);

                if ($parentOption !== null && $parentOption->family_id !== $user->family_id) {
                    $fail('The selected parent does not belong to your family.');
                }
            }],
            self::ROW => ['nullable', 'integer', 'min:0', function(string $attribute, mixed $value, Closure $fail): void {
                $parent = $this->resolveParent();

                if (!$parent instanceof StorageOption || $parent->grid_rows === null || !is_int($value)) {
                    return;
                }

                if ($value < 1 || $value > $parent->grid_rows) {
                    $fail(sprintf('The %s must be between 1 and %d for this parent.', $attribute, $parent->grid_rows));
                }
            }],
            self::COLUMN => ['nullable', 'integer', 'min:0', function(string $attribute, mixed $value, Closure $fail): void {
                $parent = $this->resolveParent();

                if (!$parent instanceof StorageOption || $parent->grid_columns === null || !is_int($value)) {
                    return;
                }

                if ($value < 1 || $value > $parent->grid_columns) {
                    $fail(sprintf('The %s must be between 1 and %d for this parent.', $attribute, $parent->grid_columns));
                }
            }],
            self::GRID_ROWS => ['nullable', 'integer', 'min:1', 'max:100', 'required_with:' . self::GRID_COLUMNS],
            self::GRID_COLUMNS => ['nullable', 'integer', 'min:1', 'max:100', 'required_with:' . self::GRID_ROWS],
        ];
    }

    public function toDto(): StorageOptionData
    {
        return new StorageOptionData(
            name: $this->safe()->string(self::NAME)->toString(),
            description: $this->isNotFilled(self::DESCRIPTION) ? null : $this->safe()->string(self::DESCRIPTION)->toString(),
            parentId: $this->isNotFilled(self::PARENT_ID) ? null : $this->safe()->integer(self::PARENT_ID),
            row: $this->isNotFilled(self::ROW) ? null : $this->safe()->integer(self::ROW),
            column: $this->isNotFilled(self::COLUMN) ? null : $this->safe()->integer(self::COLUMN),
            gridRows: $this->isNotFilled(self::GRID_ROWS) ? null : $this->safe()->integer(self::GRID_ROWS),
            gridColumns: $this->isNotFilled(self::GRID_COLUMNS) ? null : $this->safe()->integer(self::GRID_COLUMNS),
        );
    }

    private function resolveParent(): ?StorageOption
    {
        $parentId = $this->input(self::PARENT_ID);

        if (!is_int($parentId) && !(is_string($parentId) && ctype_digit($parentId))) {
            return null;
        }

        /** @var StorageOption|null $parent */
        $parent = StorageOption::query()->find((int) $parentId);

        return $parent;
    }
}
