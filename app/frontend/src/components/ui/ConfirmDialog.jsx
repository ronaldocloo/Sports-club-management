import Modal from './Modal'
import Button from './Button'

function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger = false, loading = false, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{description}</p>
    </Modal>
  )
}

export default ConfirmDialog
