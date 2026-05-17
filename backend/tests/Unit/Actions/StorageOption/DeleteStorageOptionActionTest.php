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
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should call delete on the storage option', function(): void {
        // arrange
        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once();

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

        // assert - Mockery expectations verify the interactions
    });

    it('should recursively delete children', function(): void {
        // arrange
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
        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once();

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

        // assert - Mockery expectations verify the interactions
    });

    it('should eager load the full tree before the transaction', function(): void {
        // arrange
        $storageOptionPartsRelation = \Mockery::mock(HasMany::class);
        $storageOptionPartsRelation->shouldReceive('delete')->once();

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

        // assert - Mockery expectations verify load() was called
    });
});
