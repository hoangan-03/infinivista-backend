export enum ERRORS_DICTIONARY {
	// AUTHENTICATION AND AUTHORIZATION ERRORS
	EMAIL_EXISTED = 'ATH_0091', // Email already exists during signup or update.
	WRONG_CREDENTIALS = 'ATH_0001', // Incorrect email or password provided.
	CONTENT_NOT_MATCH = 'ATH_0002', // Provided authentication content does not match expectations.
	UNAUTHORIZED_EXCEPTION = 'ATH_0011', // User does not have permission to access the resource.

	// TOPIC ERRORS
	TOPIC_NOT_FOUND = 'TOP_0041', // Requested topic could not be found.

	// USER ERRORS
	USER_NOT_FOUND = 'USR_0041', // User could not be located in the database.

	// VALIDATION ERRORS (CLASS VALIDATOR)
	VALIDATION_ERROR = 'CVL_0001', // Generic validation error from input fields.

	// DATABASE ERRORS
	DB_CONNECTION_FAILED = 'DB_0001', // Unable to connect to the database.
	DB_QUERY_FAILED = 'DB_0002', // A database query failed unexpectedly.

	// SERVER ERRORS
	SERVER_ERROR = 'SRV_0001', // Generic server error (500 Internal Server Error).
	RESOURCE_NOT_FOUND = 'SRV_0040', // Requested resource does not exist (404).

	// CLIENT ERRORS
	BAD_REQUEST = 'CLI_0001', // Client sent a bad request (400 Bad Request).
	FORBIDDEN = 'CLI_0043', // Client is forbidden from performing this action (403).

	// FILE ERRORS
	FILE_UPLOAD_FAILED = 'FIL_0051', // File upload process failed.
	FILE_NOT_FOUND = 'FIL_0052', // Requested file does not exist on the server.

	// PAYMENT ERRORS
	PAYMENT_FAILED = 'PAY_0061', // Payment transaction was unsuccessful.
	PAYMENT_INVALID = 'PAY_0062', // Invalid payment details provided.
}
