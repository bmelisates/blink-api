function Logo({ className }) {
  return (
    <img 
      src="/logo.png" 
      alt="Blink Logo" 
      className={className || "logo-image"} 
    />
  )
}

export default Logo
