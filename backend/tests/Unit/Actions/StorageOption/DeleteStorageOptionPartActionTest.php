<?php

declare(strict_types = 1);

use App\Actions\StorageOption\DeleteStorageOptionPartAction;
use App\Models\StorageOptionPart;
use Illuminate\Database\ConnectionInterface;

covers(DeleteStorageOptionPartAction::class);

describe('DeleteStorageOptionPartAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should call delete on the storage option part', function(): void {
        // arrange
        $storageOptionPart = \Mockery::mock(StorageOptionPart::class);
        $storageOptionPart->shouldReceive('delete')->once();

        $action = new DeleteStorageOptionPartAction($this->db);

        // act
        $action->execute($storageOptionPart);

        // assert - Mockery expectations verify the interactions
    });
});
