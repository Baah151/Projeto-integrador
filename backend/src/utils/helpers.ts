export function successResponse(data: unknown, message = 'Operacao realizada com sucesso') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(message: string, error = 'ERROR') {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}
