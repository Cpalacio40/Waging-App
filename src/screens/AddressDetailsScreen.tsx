import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  buildingOption,
  type BuildingType,
  type SavedAddress,
} from '../data/savedAddress'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const addressAsset = (name: string) => assetUrl(`address/${name}`)

type AddressDetailsScreenProps = {
  place: { label: string; secondary: string; lat: number; lng: number }
  buildingType: BuildingType
  /** Prefill when editing an existing saved address. */
  initial?: {
    id?: string
    floor?: string
    door?: string
    notes?: string
    tag?: string
  }
  onBack?: () => void
  onAdjustPin?: () => void
  onSave?: (address: SavedAddress) => void
  /** When set (editing an existing address), show the trash control beside the summary. */
  onDelete?: () => void
}

function miniPinIcon(buildingType: BuildingType) {
  return L.icon({
    iconUrl: addressAsset(buildingOption(buildingType).pin),
    iconSize: [44, 51],
    iconAnchor: [22, 51],
  })
}

export function AddressDetailsScreen({
  place,
  buildingType,
  initial,
  onBack,
  onAdjustPin,
  onSave,
  onDelete,
}: AddressDetailsScreenProps) {
  const defaultTag = buildingOption(buildingType).label
  const initialTag = initial?.tag?.trim() || defaultTag
  const [floor, setFloor] = useState(initial?.floor ?? '')
  const [door, setDoor] = useState(initial?.door ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [tags, setTags] = useState<string[]>(() => {
    const base = [defaultTag]
    if (initialTag && !base.some((t) => t.toLowerCase() === initialTag.toLowerCase())) {
      return [...base, initialTag]
    }
    return base
  })
  const [tag, setTag] = useState(initialTag)
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [tagModalMode, setTagModalMode] = useState<'add' | 'edit'>('add')
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [newTagDraft, setNewTagDraft] = useState('')
  const miniMapRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)

  const isDefaultTag = (value: string) =>
    value.trim().toLowerCase() === defaultTag.toLowerCase()

  const isCustomTag = (value: string) => !isDefaultTag(value)

  useEffect(() => {
    if (!miniMapRef.current || mapRef.current) return

    const map = L.map(miniMapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([place.lat, place.lng], 16)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 },
    ).addTo(map)

    markerRef.current = L.marker([place.lat, place.lng], {
      icon: miniPinIcon(buildingType),
    }).addTo(map)
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [place.lat, place.lng])

  useEffect(() => {
    markerRef.current?.setIcon(miniPinIcon(buildingType))
  }, [buildingType])

  useEffect(() => {
    if (!tagModalOpen) return
    const id = requestAnimationFrame(() => tagInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [tagModalOpen])

  const buildingIcon = buildingOption(buildingType).icon
  const requiresUnitFields = buildingType === 'apartamento' || buildingType === 'oficina'
  const canSave =
    !requiresUnitFields || (floor.trim().length > 0 && door.trim().length > 0)

  const openTagModal = () => {
    setTagModalMode('add')
    setEditingTag(null)
    setNewTagDraft('')
    setTagModalOpen(true)
  }

  const openEditTagModal = (item: string) => {
    setTagModalMode('edit')
    setEditingTag(item)
    setNewTagDraft(item)
    setTagModalOpen(true)
  }

  const closeTagModal = () => {
    setTagModalOpen(false)
    setTagModalMode('add')
    setEditingTag(null)
    setNewTagDraft('')
  }

  const onChipClick = (item: string) => {
    if (tag === item) {
      if (isCustomTag(item)) openEditTagModal(item)
      return
    }
    setTag(item)
  }

  const addTag = () => {
    const value = newTagDraft.trim()
    if (!value) return

    const existing = tags.find((t) => t.toLowerCase() === value.toLowerCase())
    if (existing) {
      setTag(existing)
      closeTagModal()
      return
    }

    setTags((prev) => [...prev, value])
    setTag(value)
    closeTagModal()
  }

  const saveEditedTag = () => {
    const value = newTagDraft.trim()
    if (!value || !editingTag) return

    const existing = tags.find(
      (t) => t !== editingTag && t.toLowerCase() === value.toLowerCase(),
    )
    if (existing) {
      setTags((prev) => prev.filter((t) => t !== editingTag))
      setTag(existing)
      closeTagModal()
      return
    }

    setTags((prev) => prev.map((t) => (t === editingTag ? value : t)))
    setTag(value)
    closeTagModal()
  }

  const deleteTag = () => {
    if (!editingTag || isDefaultTag(editingTag)) return
    setTags((prev) => {
      const next = prev.filter((t) => t !== editingTag)
      return next.some(isDefaultTag) ? next : [defaultTag, ...next]
    })
    setTag((current) => (current === editingTag ? defaultTag : current))
    closeTagModal()
  }

  const confirmTagModal = () => {
    if (tagModalMode === 'edit') saveEditedTag()
    else addTag()
  }

  const submit = () => {
    if (!canSave) return
    onSave?.({
      id: initial?.id ?? '',
      label: place.label,
      secondary: place.secondary,
      lat: place.lat,
      lng: place.lng,
      buildingType,
      floor: floor.trim(),
      door: door.trim(),
      notes: notes.trim(),
      tag,
      savedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="screen address-details">
      <header className="address-details__header">
        <button type="button" className="caregiver-back" aria-label="Volver" onClick={onBack}>
          <img
            src={assetUrl('caregiver/arrow-left.svg')}
            alt=""
            width={32}
            height={32}
            draggable={false}
          />
        </button>
        <h1 className="address-details__title">Detalles de la dirección</h1>
      </header>

      <div className="address-details__body">
        <div className="address-details__summary">
          <img src={addressAsset(buildingIcon)} alt="" width={24} height={24} draggable={false} />
          <div className="address-details__summary-copy">
            <p className="address-details__summary-label">{place.label}</p>
            {place.secondary ? (
              <p className="address-details__summary-secondary">{place.secondary}</p>
            ) : null}
          </div>
          {onDelete ? (
            <button
              type="button"
              className="address-details__delete"
              aria-label="Eliminar dirección"
              onClick={onDelete}
            >
              <img
                src={addressAsset('trash.svg')}
                alt=""
                width={22}
                height={22}
                draggable={false}
              />
            </button>
          ) : null}
        </div>

        <div className="address-details__fields">
          <label className="address-details__field">
            <span className="address-details__field-label">
              Número de piso
              {requiresUnitFields ? (
                <span className="address-details__required" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
            <input
              className="address-details__input"
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              required={requiresUnitFields}
              aria-required={requiresUnitFields || undefined}
            />
          </label>
          <label className="address-details__field">
            <span className="address-details__field-label">
              Número de puerta
              {requiresUnitFields ? (
                <span className="address-details__required" aria-hidden="true">
                  *
                </span>
              ) : null}
            </span>
            <input
              className="address-details__input"
              type="text"
              value={door}
              onChange={(e) => setDoor(e.target.value)}
              autoComplete="off"
              required={requiresUnitFields}
              aria-required={requiresUnitFields || undefined}
            />
          </label>
          <label className="address-details__field address-details__field--full">
            <span className="address-details__field-label">Información adicional</span>
            <input
              className="address-details__input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Portal, timbre, instrucciones…"
              autoComplete="off"
            />
          </label>
          {requiresUnitFields ? (
            <p className="address-details__required-hint">
              <span className="address-details__required" aria-hidden="true">
                *
              </span>{' '}
              Campos requeridos
            </p>
          ) : null}
        </div>

        <div className="address-details__entrance">
          <h2 className="address-details__section-title">Marca tu entrada</h2>
          <p className="address-details__section-sub">
            Ayuda al cuidador a encontrarte más rápido
          </p>
          <button
            type="button"
            className="address-details__mini-wrap"
            onClick={onAdjustPin}
            aria-label="Ajustar marcador en el mapa"
          >
            <div ref={miniMapRef} className="address-details__mini-map" role="presentation" />
            <span className="address-details__adjust">Ajustar marcador</span>
          </button>
        </div>

        <div className="address-details__labels">
          <h2 className="address-details__section-title">Añade una etiqueta</h2>
          <p className="address-details__section-sub">
            Identifica esta dirección más fácilmente la próxima vez
          </p>
          <div className="address-details__chips" role="group" aria-label="Etiqueta">
            {tags.map((item) => (
              <button
                key={item}
                type="button"
                className={`address-details__chip${tag === item ? ' is-active' : ''}`}
                onClick={() => onChipClick(item)}
                aria-pressed={tag === item}
                title={
                  tag === item && isCustomTag(item)
                    ? 'Editar o eliminar etiqueta'
                    : undefined
                }
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              className="address-details__chip-add"
              aria-label="Añadir etiqueta"
              onClick={openTagModal}
            >
              <img src={addressAsset('plus.svg')} alt="" width={24} height={24} draggable={false} />
            </button>
          </div>
        </div>
      </div>

      <div className="address-details__footer">
        <button
          type="button"
          className="caregiver-cta"
          onClick={submit}
          disabled={!canSave}
        >
          Guardar dirección
        </button>
      </div>

      {tagModalOpen ? (
        <div className="address-details__modal">
          <button
            type="button"
            className="address-details__modal-backdrop"
            aria-label="Cerrar"
            onClick={closeTagModal}
          />
          <div
            className="address-details__modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-tag-modal-title"
          >
            <h2 id="address-tag-modal-title" className="address-details__modal-title">
              {tagModalMode === 'edit' ? 'Editar etiqueta' : 'Nueva etiqueta'}
            </h2>
            <div className="address-details__modal-field">
              <input
                ref={tagInputRef}
                className="address-details__input"
                type="text"
                value={newTagDraft}
                onChange={(e) => setNewTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    confirmTagModal()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    closeTagModal()
                  }
                }}
                placeholder="Ej. Trabajo, Casa de mamá…"
                maxLength={24}
                autoComplete="off"
                aria-labelledby="address-tag-modal-title"
              />
            </div>
            <div className="address-details__modal-actions">
              {tagModalMode === 'edit' ? (
                <>
                  <button
                    type="button"
                    className="address-details__modal-action address-details__modal-action--confirm"
                    onClick={confirmTagModal}
                    disabled={!newTagDraft.trim()}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    className="address-details__modal-action address-details__modal-action--danger"
                    onClick={deleteTag}
                  >
                    Eliminar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="address-details__modal-action"
                    onClick={closeTagModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="address-details__modal-action address-details__modal-action--confirm"
                    onClick={confirmTagModal}
                    disabled={!newTagDraft.trim()}
                  >
                    Añadir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
