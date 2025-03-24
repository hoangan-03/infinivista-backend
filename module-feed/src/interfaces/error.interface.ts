/**
 * Constraints object containing validation rule names and their error messages
 */
export interface ValidationErrorConstraint {
    [rule: string]: string;
}

/**
 * Detailed information about a specific validation error
 */
export interface ValidationErrorDetail {
    /**
     * The object that was validated
     */
    target?: Record<string, any>;

    /**
     * The specific value that failed validation
     */
    value?: any;

    /**
     * The property name that failed validation
     */
    property: string;

    /**
     * Array of nested validation errors (for object properties)
     */
    children: ValidationErrorDetail[];

    /**
     * Validation rules that failed with error messages
     */
    constraints: ValidationErrorConstraint;
}

/**
 * Response object containing validation error details
 */
export interface ValidationErrorResponse {
    /**
     * General error message
     */
    message: string;

    /**
     * Array of detailed validation errors
     */
    errors: ValidationErrorDetail[];
}

/**
 * Full API validation error structure
 */
export interface ApiValidationError {
    /**
     * Contains the validation error details
     */
    response: ValidationErrorResponse;

    /**
     * HTTP status code
     */
    status: number;

    /**
     * Additional exception options
     */
    options: Record<string, any>;

    /**
     * Error message
     */
    message: string;

    /**
     * Exception class name
     */
    name: string;
}

/**
 * RPC exception structure used for microservice communication
 */
export interface RpcValidationException {
    statusCode: number;
    message: string;
    response: ValidationErrorResponse;
}
