import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Users } from 'lucide-react'
import { ConfirmDialog, DateRangePicker, Modal, StatCard } from '../ui'
import { renderInRouter } from '../../test/render'
import { presetRange } from '../../utils/ranges'

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden">body</Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('is an accessible dialog that closes with Escape, the X button and a click outside', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="Edit thing">content</Modal>)
    expect(screen.getByRole('dialog', { name: 'Edit thing' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
  it('does not close when clicking inside the dialog', async () => {
    const onClose = vi.fn()
    render(<Modal open onClose={onClose} title="T">inside text</Modal>)
    await userEvent.click(screen.getByText('inside text'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('ConfirmDialog', () => {
  it('asks first, then confirms or cancels', async () => {
    const onConfirm = vi.fn(); const onCancel = vi.fn()
    render(<ConfirmDialog open title="Delete athlete?" description="This cannot be undone." confirmLabel="Delete" danger onConfirm={onConfirm} onCancel={onCancel} />)
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled(); expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
  it('cannot be confirmed twice while the action is running', () => {
    render(<ConfirmDialog open title="T" description="d" confirmLabel="Go" loading onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled()
  })
})

describe('StatCard', () => {
  it('shows the value, a positive trend in green with a plus sign, and a link', () => {
    renderInRouter(<StatCard icon={Users} label="Athletes" value="120" trend={8} note="vs last month" to="/athletes" linkLabel="View athletes" />)
    expect(screen.getByText('Athletes')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('+8%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View athletes/ })).toHaveAttribute('href', '/athletes')
  })
  it('shows a negative trend without a plus, and hides a flat one', () => {
    const { rerender } = renderInRouter(<StatCard label="Revenue" value="1" trend={-4} />)
    expect(screen.getByText('-4%')).toBeInTheDocument()
    rerender(<StatCard label="Revenue" value="1" trend={0} />)
    expect(screen.queryByText(/%/)).toBeNull()
  })
})

describe('DateRangePicker', () => {
  const value = { preset: '30d', ...presetRange('30d') }
  it('picking a preset reports the matching dates', async () => {
    const onChange = vi.fn()
    render(<DateRangePicker value={value} onChange={onChange} />)
    await userEvent.selectOptions(screen.getByLabelText('Date range'), '90d')
    expect(onChange).toHaveBeenCalledWith({ preset: '90d', ...presetRange('90d') })
  })
  it('custom range reveals date inputs limited by each other', async () => {
    const onChange = vi.fn()
    render(<DateRangePicker value={value} onChange={onChange} />)
    expect(screen.queryByLabelText('From date')).toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('Date range'), 'custom')
    expect(screen.getByLabelText('From date')).toHaveAttribute('max', value.to)
    expect(screen.getByLabelText('To date')).toHaveAttribute('min', value.from)
    expect(onChange).toHaveBeenCalledWith({ preset: 'custom', from: value.from, to: value.to })
  })
})
