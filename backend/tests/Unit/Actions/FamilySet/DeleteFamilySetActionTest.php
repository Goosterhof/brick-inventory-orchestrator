<?php

declare(strict_types = 1);

use App\Actions\FamilySet\DeleteFamilySetAction;
use App\Models\FamilySet;
use Illuminate\Database\ConnectionInterface;

covers(DeleteFamilySetAction::class);

describe('DeleteFamilySetAction', function(): void {
    beforeEach(function(): void {
        $this->db = \Mockery::mock(ConnectionInterface::class);
        $this->db->allows('transaction')->andReturnUsing(fn(\Closure $callback) => $callback());
    });

    it('should call delete on the family set', function(): void {
        // arrange
        $familySet = \Mockery::mock(FamilySet::class);
        $familySet->shouldReceive('delete')->once();

        $action = new DeleteFamilySetAction($this->db);

        // act
        $action->execute($familySet);

        // assert - Mockery expectations verify the interactions
    });
});
