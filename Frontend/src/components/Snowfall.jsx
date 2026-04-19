import React from 'react'

const Snowfall = () => {
  const snowflakes = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 4 + 4,
    size: Math.random() * 4 + 3
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          style={{
            position: 'absolute',
            left: `${flake.left}%`,
            top: '-20px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            animation: `fall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
            opacity: 0.8
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fall {
            0% { transform: translateY(-20px); }
            100% { transform: translateY(100vh); }
          }
        `
      }} />
    </div>
  )
}

export default Snowfall
