<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Auth\AccountProvisioningPermit;
use App\Models\Family;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use RuntimeException;

use function sprintf;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $environment = app()->environment();

        if (!app()->environment(['local', 'testing'])) {
            // WR-2192: the seeded account has a known password, so seeding it anywhere a
            // stranger can reach would open BIO to them. Reference data seeds by --class.
            throw new RuntimeException(sprintf('DatabaseSeeder creates a known-password account and refuses to run in the "%s" environment (WR-2192); seed reference data with db:seed --class instead.', $environment));
        }

        // Reference data seeders (no family required)
        $this->call([
            ColorSeeder::class,
            PartSeeder::class,
            SetSeeder::class,
            SetPartSeeder::class,
        ]);

        // Create a test family for tenant-scoped seeders
        $family = Family::factory()->create(['name' => 'Test Family']);

        // Create a test user for the family; WR-2128 refuses a User insert without the permit.
        AccountProvisioningPermit::during(fn(): User => User::factory()->create([
            'family_id' => $family->id,
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]));

        // Tenant seeders (create tenant entities such as families)
        // Uncomment to create additional families:
        // (new FamilySeeder())->run();

        // Tenant-scoped seeders (require existing family parameter)
        // Uncomment to seed additional data for the test family:
        // (new UserSeeder())->run($family);
        // (new FamilySetSeeder())->run($family);
        // (new StorageOptionSeeder())->run($family);
    }
}
