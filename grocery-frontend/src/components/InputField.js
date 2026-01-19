// src/components/InputField.js
export default function InputField({ type, placeholder, value, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full mb-4 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-600 focus:outline-none"
      required
    />
  );
}
