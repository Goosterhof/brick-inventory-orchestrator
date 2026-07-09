<?php

declare(strict_types = 1);

use App\Actions\StorageOption\DeleteStorageOptionAction;
use App\Models\StorageOption;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;

covers(DeleteStorageOptionAction::class);

describe('DeleteStorageOptionAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
    });

    it('should delete the storage option inside the transaction boundary', function(): void {
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

        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('load')
            ->with('children.storageOptionParts', 'storageOptionParts')
            ->once()
            ->andReturnSelf();
        $storageOption->shouldReceive('getAttribute')->with('children')->andReturn(new Collection);
        $storageOption->shouldReceive('storageOptionParts')->once()->andReturn($storageOptionPartsRelation);
        $storageOption->shouldReceive('delete')->once()->andReturnUsing(function() use (&$events): bool {
            $events[] = 'delete';

            return true;
        });

        $action = new DeleteStorageOptionAction($this->db);

        // act
        $action->execute($storageOption);

        // assert — the delete happened, and it happened inside the transaction
        expect($events)->toBe(['transaction:begin', 'delete', 'transaction:end']);
    });

    it('should recursively delete children', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $childPartsRelation = \Mockery::mock(HasMany::class);
        $childPartsRelation->shouldReceive('delete')->once();

        $child = \Mockery::mock(StorageOption::class);
        $child->shouldReceive('getAttribute')->with('children')->andReturn(new Collection);
        $child->shouldReceive('storageOptionParts')->once()->andReturn($childPartsRelation);
        $child->shouldReceive('delete')->once();

        $parentPartsRelation = \Mockery::mock(HasMany::class);
        $parentPartsRelation->shouldReceive('delete')->once();

        $parent = \Mockery::mock(StorageOption::class);
        $parent->shouldReceive('load')
            ->with('children.storageOptionParts', 'storageOptionParts')
            ->once()
            ->andReturnSelf();
        $parent->shouldReceive('getAttribute')->with('children')->andReturn(new Collection([$child]));
        $parent->shouldReceive('storageOptionParts')->once()->andReturn($parentPartsRelation);
        $parent->shouldReceive('delete')->once();

        $action = new DeleteStorageOptionAction($this->db);

        // act
        $action->execute($parent);

        // assert - Mockery expectations verify the interactions
    });

    it('should delete storage option parts', function(): void {
        // arrange
        $this->db->shouldReceive('transaction')->once()->andReturnUsing(fn(\Closure $callback) => $callback());

        $partsDeleted = false;
        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once()->andReturnUsing(function() use (&$partsDeleted): int {
            $partsDeleted = true;

            return 1;
        });

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('load')
            ->with('children.storageOptionParts', 'storageOptionParts')
            ->once()
            ->andReturnSelf();
        $storageOption->shouldReceive('getAttribute')->with('children')->andReturn(new Collection);
        $storageOption->shouldReceive('storageOptionParts')->once()->andReturn($storageOptionPartsRelation);
        $storageOption->shouldReceive('delete')->once();

        $action = new DeleteStorageOptionAction($this->db);

        // act
        $action->execute($storageOption);

        // assert — the storage option parts were deleted
        expect($partsDeleted)->toBeTrue();
    });

    it('should eager load the full tree before the transaction', function(): void {
        // arrange — record the order of events to prove load() runs before the transaction opens
        $events = [];

        $this->db->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function(\Closure $callback) use (&$events): mixed {
                $events[] = 'transaction:begin';

                return $callback();
            });

        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once();

        $storageOption = \Mockery::mock(StorageOption::class);
        $storageOption->shouldReceive('load')
            ->with('children.storageOptionParts', 'storageOptionParts')
            ->once()
            ->andReturnUsing(function() use (&$events, &$storageOption): StorageOption {
                $events[] = 'load';

                return $storageOption;
            });
        $storageOption->shouldReceive('getAttribute')->with('children')->andReturn(new Collection);
        $storageOption->shouldReceive('storageOptionParts')->once()->andReturn($storageOptionPartsRelation);
        $storageOption->shouldReceive('delete')->once();

        $action = new DeleteStorageOptionAction($this->db);

        // act
        $action->execute($storageOption);

        // assert — the eager load completed before the transaction opened
        expect($events)->toBe(['load', 'transaction:begin']);
    });
});
