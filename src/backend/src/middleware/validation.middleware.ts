// Mock middleware
export function validateRequest(schema: any) {
  return (req: any, res: any, next: any) => next();
}
