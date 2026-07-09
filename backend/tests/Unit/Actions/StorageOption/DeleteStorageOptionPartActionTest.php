<?php

declare(strict_types = 1);

use App\Actions\StorageOption\DeleteStorageOptionPartAction;
use App\Models\StorageOptionPart;
use Illuminate\Database\ConnectionInterface;

covers(DeleteStorageOptionPartAction::class);

describe('DeleteStorageOptionPartAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    it('should delete the storage option part inside the transaction boundary', function(): void {
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

        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('delete')->once()->andReturnUsing(function() use (&$events): bool {
            $events[] = 'delete';

            return true;
        });

        $action = new DeleteStorageOptionPartAction($this->db);

        // act
        $action->execute($storageOptionPart);

        // assert — the delete happened, and it happened inside the transaction
        expect($events)->toBe(['transaction:begin', 'delete', 'transaction:end']);
    });
});
