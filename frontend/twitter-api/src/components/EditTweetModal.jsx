import './EditTweetModal.css'

export default function EditTweetModal({ editingTweet, editContent, setEditContent, onCancel, onSave }) {
  if (!editingTweet) return null

  return (
    <div className="edit-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="edit-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Tweeti Düzenle</h3>
        <textarea
          className="edit-textarea"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSave()
            }
          }}
        />
        <div className="edit-modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>İptal</button>
          <button className="save-btn" onClick={onSave}>Kaydet</button>
        </div>
      </div>
    </div>
  )
}
