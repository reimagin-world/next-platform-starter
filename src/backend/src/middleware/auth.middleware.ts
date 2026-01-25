// Mock middleware
export function authenticate(req: any, res: any, next: any) {
  req.user = { userId: 'mock-user-id' };
  next();
}
