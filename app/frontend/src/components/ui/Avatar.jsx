const palette = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700']

function Avatar({ name = '', size = 36 }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('')
  const tone = palette[name.length % palette.length]
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${tone}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials || '?'}
    </div>
  )
}

export default Avatar
