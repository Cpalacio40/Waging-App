import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  BUILDING_OPTIONS,
  DEFAULT_ADDRESS_TAGS,
  type BuildingType,
  type SavedAddress,
} from '../data/savedAddress'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const addressAsset = (name: string) => assetUrl(`address/${name}`)

type AddressDetailsScreenProps = {
  place: { label: string; secondary: string; lat: number; lng: number }
  buildingType: BuildingType
  onBack?: () => void
  onAdjustPin?: () => void
  onSave?: (address: SavedAddress) => void
}

function miniPinIcon() {
  return L.icon({
    iconUrl: addressAsset('pin-house.svg'),
    iconSize: [44, 51],
    iconAnchor: [22, 51],
  })
}

export function AddressDetailsScreen({
  place,
  buildingType,
  onBack,
  onAdjustPin,
  onSave,
}: AddressDetailsScreenProps) {
  const [floor, setFloor] = useState('')
  const [door, setDoor] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([...DEFAULT_ADDRESS_TAGS])
  const [tag, setTag] = useState(DEFAULT_ADDRESS_TAGS[0])
  const [tagModalOpen, setTagModalOpen] = useState(false)
  const [newTagDraft, setNewTagDraft] = useState('')
  const miniMapRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tagInputRef = useRef<HTMLInputElement | null>(null)

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

    L.marker([place.lat, place.lng], { icon: miniPinIcon() }).addTo(map)
    mapRef.current = map
    requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [place.lat, place.lng])

  useEffect(() => {
    if (!tagModalOpen) return
    const id = requestAnimationFrame(() => tagInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [tagModalOpen])

  const buildingIcon =
    BUILDING_OPTIONS.find((o) => o.id === buildingType)?.icon ?? 'house.svg'

  const openTagModal = () => {
    setNewTagDraft('')
    setTagModalOpen(true)
  }

  const closeTagModal = () => {
    setTagModalOpen(false)
    setNewTagDraft('')
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

  const submit = () => {
    onSave?.({
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
        </div>

        <div className="address-details__fields">
          <label className="address-details__field">
            <span className="address-details__field-label">Número de piso</span>
            <input
              className="address-details__input"
              type="text"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
            />
          </label>
          <label className="address-details__field">
            <span className="address-details__field-label">Número de puerta</span>
            <input
              className="address-details__input"
              type="text"
              value={door}
              onChange={(e) => setDoor(e.target.value)}
              autoComplete="off"
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
        </div>

        <div className="address-details__entrance">
          <h2 className="address-details__section-title">Marca tu entrada</h2>
          <p className="address-details__section-sub">
            Ayuda al cuidador a encontrarte más rápido
          </p>
          <div className="address-details__mini-wrap">
            <div ref={miniMapRef} className="address-details__mini-map" role="presentation" />
            <button type="button" className="address-details__adjust" onClick={onAdjustPin}>
              Ajustar marcador
            </button>
          </div>
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
                onClick={() => setTag(item)}
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
        <button type="button" className="caregiver-cta" onClick={submit}>
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
              Nueva etiqueta
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
                    addTag()
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
                onClick={addTag}
                disabled={!newTagDraft.trim()}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
