import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Plus, Trash2 } from 'lucide-react'
import { Avatar, Button, Screen, Sheet, TextField } from '@/design-system'
import type { Dare } from '@/engine'
import { CustomDareForm } from '@/features/dares/CustomDareForm'
import { CustomDareList } from '@/features/dares/CustomDareList'
import { format } from '@/i18n/format'
import { useT } from '@/i18n/useT'
import { LimitsEditor } from './LimitsEditor'
import { playersStore, usePlayers, type CustomDareDraft } from './playersStore'
import { useStats } from './statsStore'
import { validatePlayerName } from './validation'

export function PlayerEditorScreen() {
  const t = useT()
  const navigate = useNavigate()
  const { playerId = '' } = useParams()
  const players = usePlayers((s) => s.players)
  const player = players.find((p) => p.id === playerId)
  const stats = useStats((s) => s.byPlayer[playerId]) ?? { games: 0, done: 0, skipped: 0 }
  const [name, setName] = useState(player?.name ?? '')
  const [nameError, setNameError] = useState<string>()
  const [editing, setEditing] = useState<CustomDareDraft | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!player) return <Navigate to="/joueurs" replace />
  const store = playersStore.getState()

  function saveName() {
    const others = players.filter((p) => p.id !== playerId).map((p) => p.name)
    const result = validatePlayerName(name, others)
    if (!result.ok) return setNameError(t.players.nameErrors[result.reason])
    store.updatePlayer(playerId, { name: result.name })
  }

  return (
    <Screen title={player.name} back={() => navigate('/joueurs')} backLabel={t.common.back}>
      <div className="flex flex-col gap-10 pt-4">
        <div className="flex items-end gap-4">
          <Avatar name={player.name} size="lg" />
          <div className="flex-1">
            <TextField
              label={t.players.name}
              value={name}
              error={nameError}
              onChange={(e) => {
                setName(e.target.value)
                setNameError(undefined)
              }}
              onBlur={saveName}
            />
          </div>
        </div>

        <p className="-mt-6 text-sm font-semibold text-muted">
          {format(t.players.stats, { ...stats })}
        </p>

        <LimitsEditor
          limits={player.limits}
          onChange={(limits) => store.updatePlayer(playerId, { limits })}
        />

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-extrabold">{t.nav.dares}</h2>
          <CustomDareList
            dares={player.customDares}
            onEdit={(dare: Dare) => setEditing(dare)}
            onRemove={(dare: Dare) => store.removeCustomDare(playerId, dare.id)}
          />
          <Button variant="ghost" onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" size={18} />
            {t.dareForm.add}
          </Button>
        </section>

        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 aria-hidden="true" size={18} />
          {t.players.remove}
        </Button>
      </div>

      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? t.dareForm.newTitle : t.dareForm.editTitle}
      >
        {editing !== null ? (
          <CustomDareForm
            initial={editing === 'new' ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSave={(draft) => {
              store.upsertCustomDare(playerId, draft)
              setEditing(null)
            }}
          />
        ) : null}
      </Sheet>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={format(t.players.removeConfirm, { name: player.name })}
      >
        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              store.removePlayer(playerId)
              navigate('/joueurs', { replace: true })
            }}
          >
            {t.common.delete}
          </Button>
        </div>
      </Sheet>
    </Screen>
  )
}
