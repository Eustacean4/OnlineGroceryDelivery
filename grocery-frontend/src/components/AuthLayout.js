export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-md p-6 rounded-md w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
