<?php

declare(strict_types = 1);

use App\Actions\FamilySet\DeleteFamilySetAction;
use App\Models\FamilySet;
use Illuminate\Database\ConnectionInterface;

covers(DeleteFamilySetAction::class);

describe('DeleteFamilySetAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    it('should delete the family set inside the transaction boundary', function(): void {
        // arrange — record the order of events to prove the delete runs inside the transaction
        $events = [];

        $this->db->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function(\Closure $callback) use (&$events): mixed {
                $events[] = 'transaction:begin';
                $result = $callback();
                $events[] = 'transaction:end';

                return $result;
            });

        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('delete')->once()->andReturnUsing(function() use (&$events): bool {
            $events[] = 'delete';

            return true;
        });

        $action = new DeleteFamilySetAction($this->db);

        // act
        $action->execute($familySet);

        // assert — the delete happened, and it happened inside the transaction
        expect($events)->toBe(['transaction:begin', 'delete', 'transaction:end']);
    });
});
