function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        {eyebrow && <p className="text-sm font-medium text-blue-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}

export default PageHeader
