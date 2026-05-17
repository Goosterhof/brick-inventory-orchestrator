# Contributing

Thank you for your interest in contributing to LEGO Storage!

## Getting Started

1. Fork the repository
2. Clone your fork and set up the project:

```bash
git clone https://github.com/your-username/brick-inventory-backend.git
cd brick-inventory-backend
composer setup
```

3. Create a branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Running the Application

```bash
composer dev
```

### Code Quality

Before submitting a pull request, ensure all checks pass:

```bash
composer lint      # Fix code style (Rector + Pint)
composer phpstan   # Static analysis
composer test      # Run all tests
```

### Testing Requirements

- Unit tests require 100% coverage for Actions and Services
- Feature tests require 80% coverage for Controllers
- Run architecture tests to ensure patterns are followed:

```bash
composer test:arch
```

## Code Style

This project follows:

- [PSR-12](https://www.php-fig.org/psr/psr-12/) coding standard
- [Laravel conventions](https://laravel.com/docs/contributions#coding-style)
- Automated formatting via Laravel Pint and Rector

## Architecture Guidelines

- **Action classes** - For business logic (single responsibility)
- **Service classes** - For external API integrations only
- **ResourceData classes** - For API response DTOs
- **Standard Laravel** - Controllers, Models, Form Requests

## Pull Request Process

1. Ensure all tests pass and code quality checks succeed
2. Update documentation if needed
3. Write a clear PR description explaining your changes
4. Link any related issues

## Reporting Issues

- Check existing issues before creating a new one
- Include steps to reproduce for bugs
- For security issues, see [SECURITY.md](SECURITY.md)

## Questions?

Feel free to open an issue for questions or discussions about potential contributions.
