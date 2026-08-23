```
API
 │
 ├── success response
 │
 └── error response
       │
       ├── code
       ├── message
       ├── details
       └── requestId
```
```TypeScript
{
    success: true,
    data: ...
}
```
OR
```TypeScript
{
    success: false,
    error: {
        code: "...",
        message: "...",
        details?: ...
    }
}
```