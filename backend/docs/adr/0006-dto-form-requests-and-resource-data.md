# Decision: DTOFormRequest and Custom ResourceData

**Date**: 2026-03-22
**Feature**: Type-safe data crossing the HTTP boundary in both directions
**Status**: accepted
**Transferability**: universal

## Context

Data crosses two boundaries: request → action (input) and model → response (output). Laravel provides FormRequest for validation and ApiResource for responses. Both have limitations:

- FormRequest validates but returns untyped arrays via `$request->validated()`
- ApiResource wraps responses in a `data` key, has implicit lazy loading risks, and doesn't self-document relationship dependencies

The forces:
- Actions must receive typed input (ADR-0003) — no raw arrays or Request objects
- Responses must be predictable — no surprise `data` wrappers, no N+1 queries from lazy loading
- The pattern must be enforceable by architecture tests

## Options Considered

### Input Handling

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **FormRequest with `toDto()` bridge** | Type-safe; co-located with validation; controller stays thin; DTO construction uses `$this->safe()` for safety | FormRequest has two responsibilities (validation + DTO construction) | **Chosen** — the "two responsibilities" concern is minor; the bridge is trivially simple |
| **Separate mapper/factory class** | Pure SRP; FormRequest only validates | Extra class per request; indirection for a simple mapping; controller must orchestrate | Eliminated — over-engineering for a direct field-to-property mapping |
| **Pass `$request->validated()` array to Action** | No extra classes | Untyped; Action must validate array structure; loses type safety | Eliminated — defeats the purpose of typed parameters |
| **Pass FormRequest directly to Action** | Simple | Violates ADR-0003 (Actions must not depend on Request objects); couples business logic to HTTP | Eliminated — architectural violation |

### Output Handling

| Option | Pros | Cons | Why eliminated / Why chosen |
|--------|------|------|-----------------------------|
| **Custom ResourceData with `from()` factory** | Self-documenting relationships; no `data` wrapper; testable; explicit eager loading | Custom base class; two concepts to learn | **Chosen** — type safety and explicitness are non-negotiable |
| **Laravel ApiResource** | Built-in; well-documented | Wraps in `data` key; lazy loading risks; less explicit about properties; hard to enforce eager loading | Eliminated — too much implicit behavior |
| **Spatie Laravel Data** | Full-featured; handles both input and output | Evaluated — but custom ResourceData is simpler, already in place, and does exactly what's needed without the package overhead | Eliminated — over-featured for the requirements |

## Decision

### Input: FormRequest with `toDto()` Bridge

Every FormRequest that feeds an Action must declare a `toDto()` method that returns a `final readonly` DTO. The controller calls `$request->toDto()` and passes the result to the Action.

```php
// FormRequest — validates and bridges
final class StoreFamilySetRequest extends FormRequest
{
    private const string SET_NUM = 'set_num';
    private const string QUANTITY = 'quantity';

    public function rules(): array
    {
        return [
            self::SET_NUM => ['required', 'string', 'max:255'],
            self::QUANTITY => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function toDto(): CreateFamilySetData
    {
        return new CreateFamilySetData(
            setNum: $this->safe()->string(self::SET_NUM)->toString(),
            quantity: $this->isNotFilled(self::QUANTITY)
                ? 1
                : $this->safe()->integer(self::QUANTITY),
        );
    }
}

// DTO — immutable, typed
final readonly class CreateFamilySetData
{
    public function __construct(
        public string $setNum,
        public int $quantity,
    ) {}
}

// Controller — thin bridge
public function store(StoreFamilySetRequest $request, CreateFamilySetAction $action): JsonResponse
{
    $familySet = $action->execute($request->user()->family, $request->toDto());
    return FamilySetResourceData::from($familySet)->toResponseWithStatus(201);
}
```

**Conventions within the bridge pattern:**
- Field name constants are `private const` — internal to the FormRequest, not part of its public API
- `$this->safe()` is always used (never raw `$this->input()`) — only validated data enters the DTO
- Default values for optional fields are handled in `toDto()`, not in the DTO constructor
- Type coercion (enum parsing, date parsing) happens in `toDto()` — the DTO receives final types

### Output: Custom ResourceData

Response DTOs extend a custom `ResourceData` base class (not Laravel's ApiResource):
- `final readonly` concrete classes with snake_case properties
- Static `from(Model)` factory method — constructs from Manifest data
- `collection()` for lists — handles eager loading automatically
- `EAGER_LOAD` constant when nesting related data — prevents N+1 queries
- Implements `JsonSerializable` + `Responsable` — controllers call `->toResponse()`

```php
final readonly class StorageOptionResourceData extends ResourceData
{
    public const array EAGER_LOAD = ['children', 'storageOptionParts'];

    public static function from(StorageOption $storageOption): self
    {
        $storageOption->loadMissing(self::EAGER_LOAD);
        return new self(
            id: $storageOption->id,
            name: $storageOption->name,
            // ...
        );
    }
}
```

## Consequences

- Type safety at both boundaries — Actions receive DTOs, clients receive structured responses
- No `data` wrapper in API responses — ResourceData serializes directly
- `EAGER_LOAD` constants self-document relationship dependencies — architecture tests enforce their presence when nested ResourceData is used
- Controllers call `->toResponse()` or `->toResponseWithStatus()` — never return ResourceData directly
- Adding a new endpoint means creating a FormRequest (with DTO), a ResourceData, and wiring them through a thin controller
- Each FormRequest has a clear, testable contract: rules + toDto
- Controllers reduce to one-liners: `$action->execute($request->toDto(), ...)`
- Adding a field means updating three places: rules, toDto, and the DTO class — but this is a feature (explicit surface area)

## Enforcement

| What | Mechanism | Scope |
|------|-----------|-------|
| FormRequests are `final` | `RequestArchitectureTest` | `app/Http/Requests/` |
| No public constants on FormRequests | `RequestArchitectureTest` | `app/Http/Requests/` |
| Actions don't accept Request objects | `ActionArchitectureTest` | `app/Actions/` |
| ResourceData concrete classes are `final readonly` | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| ResourceData has `from()` method | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| `EAGER_LOAD` required when nesting ResourceData | `ResourceDataArchitectureTest` | `app/Http/Resources/` |
| Controllers don't return ResourceData directly | `ControllerArchitectureTest` | `app/Http/Controllers/` |

## Resolved Questions

### Why private constants instead of inline strings?

**Resolved 2026-03-22.** Constants prevent typos between `rules()` and `toDto()` — a misspelled field name is a compile-time error, not a runtime null. They're `private` because external code should never reference a FormRequest's field names.
