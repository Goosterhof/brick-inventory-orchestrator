<?php

declare(strict_types = 1);

namespace App\Http\Controllers;

use App\Actions\Feedback\SubmitFeedbackAction;
use App\Http\Requests\Feedback\SubmitFeedbackRequest;
use App\Http\Resources\SubmitFeedbackResourceData;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function store(
        SubmitFeedbackRequest $submitFeedbackRequest,
        #[CurrentUser]
        User $user,
        SubmitFeedbackAction $submitFeedbackAction,
    ): JsonResponse {
        $submitFeedbackResultData = $submitFeedbackAction->execute($submitFeedbackRequest->toDto(), $user->name);

        return SubmitFeedbackResourceData::from($submitFeedbackResultData)->toResponseWithStatus(201);
    }
}
