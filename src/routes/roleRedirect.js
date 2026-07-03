export function getDefaultPathByRole(role) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'seller':
      return '/dashboard';
    case 'buyer':
    default:
      return '/shop';
  }
}
