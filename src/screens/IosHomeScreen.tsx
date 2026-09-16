import type { CSSProperties } from 'react'
import { PagedSwipe, PagedSwipePage } from '../components/PagedSwipe'
import type { HomeScenarioId } from '../data/homeScenarios'
import { HOME_SCENARIOS } from '../data/homeScenarios'
import { WIDGET_SLIDES } from '../data/widgetSlides'
import { assetUrl } from '../utils/assetUrl'
import './screens.css'

const iosAsset = (name: string) => assetUrl(`ios-home/${name}`)

type IosHomeScreenProps = {
  onOpenApp: () => void
  scenario?: HomeScenarioId
}

/**
 * Home iOS from Figma: full-frame base art + interactive Waging widget + app icon hit target.
 * Alert scenario (activity ≤30) crossfades the pager with a single attention widget.
 */
export function IosHomeScreen({ onOpenApp, scenario = 'ok' }: IosHomeScreenProps) {
  const needsAttention = scenario === 'attention'
  const attention = HOME_SCENARIOS.attention

  return (
    <div className="screen ios-home">
      <img
        className="ios-home__base"
        src={iosAsset('home-base.png')}
        alt=""
        draggable={false}
      />

      <div className="ios-home__widget-slot">
        <div
          className={`ios-home__widget-layer${needsAttention ? '' : ' is-visible'}`}
          aria-hidden={needsAttention}
        >
          <PagedSwipe
            pageCount={WIDGET_SLIDES.length}
            ignoreSelector=".ios-home__widget-nav"
            className="ios-home__widget-pager"
            style={(state) =>
              ({
                background: WIDGET_SLIDES[state.backdropIndex].gradient,
                '--widget-chevron': WIDGET_SLIDES[state.index].chevron,
                '--chevron-left': `url(${iosAsset('chevron-left.svg')})`,
                '--chevron-right': `url(${iosAsset('chevron-right.svg')})`,
              }) as CSSProperties
            }
            overlay={(state) => (
              <div className="ios-home__widget-nav" role="group" aria-label="Navegación del widget">
                <button
                  type="button"
                  aria-label="Anterior"
                  aria-disabled={!state.canPrev}
                  disabled={!state.canPrev || needsAttention}
                  tabIndex={needsAttention ? -1 : undefined}
                  className={state.canPrev ? undefined : 'is-disabled'}
                  onClick={state.goPrev}
                >
                  <span className="ios-home__chevron ios-home__chevron--left" />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  aria-disabled={!state.canNext}
                  disabled={!state.canNext || needsAttention}
                  tabIndex={needsAttention ? -1 : undefined}
                  className={state.canNext ? undefined : 'is-disabled'}
                  onClick={state.goNext}
                >
                  <span className="ios-home__chevron ios-home__chevron--right" />
                </button>
              </div>
            )}
          >
            {WIDGET_SLIDES.map((item) => (
              <PagedSwipePage
                key={item.id}
                className="ios-home__widget"
                style={{ background: item.gradient }}
              >
                {item.decor === 'gauge' && (
                  <img
                    className="ios-home__decor ios-home__decor--waypoints"
                    src={iosAsset('waypoints.svg')}
                    alt=""
                    draggable={false}
                  />
                )}
                {item.decor === 'paw' && (
                  <img
                    className="ios-home__decor ios-home__decor--paw"
                    src={iosAsset('paw.svg')}
                    alt=""
                    draggable={false}
                  />
                )}
                {item.decor === 'moon' && (
                  <img
                    className="ios-home__decor ios-home__decor--moon"
                    src={iosAsset('moon.svg')}
                    alt=""
                    draggable={false}
                  />
                )}

                {item.decor === 'gauge' && (
                  <div className="ios-home__gauge" aria-hidden="true">
                    <img src={iosAsset('gauge.svg')} alt="" draggable={false} />
                  </div>
                )}

                <div className="ios-home__widget-body">
                  <div className="ios-home__widget-copy">
                    <div className="ios-home__widget-head">
                      <img src={iosAsset('bone.svg')} alt="" width={14} height={14} />
                      <span>Luca</span>
                    </div>
                    <p className="ios-home__widget-title">{item.title}</p>
                  </div>
                  <div className="ios-home__widget-metric">
                    {item.value ? <span>{item.value}</span> : null}
                  </div>
                </div>
              </PagedSwipePage>
            ))}
          </PagedSwipe>
        </div>

        <div
          className={`ios-home__widget-layer ios-home__widget-layer--alert${needsAttention ? ' is-visible' : ''}`}
          aria-hidden={!needsAttention}
        >
          <button
            type="button"
            className="ios-home__widget-alert"
            aria-label="Abrir Waging — Luca necesita atención"
            tabIndex={needsAttention ? undefined : -1}
            onClick={onOpenApp}
          >
            <div className="ios-home__widget ios-home__widget--alert">
              <div className="ios-home__widget-body ios-home__widget-body--alert">
                <div className="ios-home__widget-copy">
                  <div className="ios-home__widget-head ios-home__widget-head--alert">
                    <img
                      className="ios-home__widget-alert-icon"
                      src={iosAsset('alert-badge.svg')}
                      alt=""
                      width={13}
                      height={13}
                      draggable={false}
                    />
                    <span>Luca</span>
                  </div>
                  <p className="ios-home__widget-title">{attention.widgetTitle}</p>
                </div>
                <div className="ios-home__widget-metric ios-home__widget-metric--alert">
                  <span className="ios-home__widget-metric-cluster">
                    <span className="ios-home__widget-metric-value">{attention.activity}</span>
                    <span className="ios-home__widget-metric-max">/100</span>
                  </span>
                </div>
                <p className="ios-home__widget-status">{attention.widgetStatus}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <button
        type="button"
        className="ios-home__waging-hit"
        aria-label="Abrir Waging"
        onClick={onOpenApp}
      />
    </div>
  )
}
