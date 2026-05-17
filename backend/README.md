# LEGO Storage

A REST API for managing your LEGO inventory. Track which parts you have, where they're stored, and what you need to build specific sets.

## Features

- **Storage Management** - Organize parts by physical storage location (drawers, bins, containers)
- **Set Tracking** - Keep track of which LEGO sets your household owns
- **Parts Inventory** - Know exactly which parts you have and where to find them
- **Rebrickable Integration** - Import your sets and get accurate part lists
- **Brick Identification** - Identify unknown parts using image recognition (via Brickognize)
- **Multi-tenant** - Family-based accounts to share inventory with household members

## Requirements

- PHP 8.4+
- Composer
- SQLite (local development) or PostgreSQL (production)

## Installation

```bash
# Clone the repository
git clone https://github.com/Goosterhof/brick-inventory-backend.git
cd brick-inventory-backend

# Install dependencies and set up the application
composer setup
```

The `composer setup` command will:
- Install dependencies
- Create `.env` from `.env.example`
- Generate application key
- Run database migrations

## Configuration

### Required Environment Variables

```bash
# Get your API key from https://rebrickable.com/api/
REBRICKABLE_API_KEY=your_api_key_here
```

### Optional Environment Variables

```bash
# For brick identification feature (https://brickognize.com)
BRICKOGNIZE_BASE_URL=https://api.brickognize.com
```

## Development

```bash
# Start the development server (uses Laravel Octane)
composer dev

# Run tests
composer test

# Run linting (Rector + Pint)
composer lint

# Run static analysis
composer phpstan
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | Create a new user and family |
| `GET` | `/sets/{setNum}/parts` | Get parts list for a LEGO set |
| `GET` | `/storage-options` | List your storage locations |
| `POST` | `/storage-options` | Create a storage location |
| `GET` | `/storage-options/{id}/parts` | List parts in a storage location |
| `POST` | `/storage-options/{id}/parts` | Assign a part to storage |
| `GET` | `/family-sets` | List sets owned by your family |
| `POST` | `/family-sets` | Add a set to your collection |
| `POST` | `/family-sets/import-from-rebrickable` | Import sets from Rebrickable |
| `POST` | `/identify-brick` | Identify a brick from an image |

All endpoints except `/register`, `/health`, and `/sets/{setNum}/parts` require authentication via Laravel Sanctum.

## Architecture

- **Action Classes** - Business logic and orchestration
- **Service Classes** - External API integrations (Rebrickable, Brickognize)
- **ResourceData Classes** - API response DTOs
- **Multi-tenancy** - Shared database with family-based isolation

## Testing

```bash
# Run all tests
composer test

# Run architecture tests
composer test:arch

# Run unit tests with coverage (requires 100%)
composer test:coverage

# Run feature tests with coverage (requires 80%)
composer test:feature-coverage
```

## Code Quality

Before committing changes:

```bash
composer lint      # Fix code style
composer phpstan   # Check for type errors
composer test      # Run tests
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions (Railway).

## License

This project is open-sourced software licensed under the [MIT license](LICENSE).
