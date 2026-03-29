import { requireNativeView } from 'expo'

import { useContext } from 'react'
import { Image } from 'react-native'
import {
  controlEdgeToEdgeValues,
  isEdgeToEdge,
} from 'react-native-is-edge-to-edge'
import { GaleriaContext } from './context'
import { GaleriaIndexChangedEvent, GaleriaViewProps } from './Galeria.types'

const EDGE_TO_EDGE = isEdgeToEdge()

const NativeImage = requireNativeView<
  GaleriaViewProps & {
    edgeToEdge: boolean
    urls?: string[]
    theme: 'dark' | 'light'
    onIndexChange?: (event: GaleriaIndexChangedEvent) => void
    imageBackgroundColor?: string
  }
>('Galeria')

const noop = () => {}

const Galeria = Object.assign(
  function Galeria({
    children,
    urls,
    theme = 'dark',
    ids,
    imageBackgroundColor,
  }: {
    children: React.ReactNode
  } & Partial<Pick<GaleriaContext, 'theme' | 'ids' | 'urls' | 'imageBackgroundColor'>>) {
    return (
      <GaleriaContext.Provider
        value={{
          hideBlurOverlay: false,
          hidePageIndicators: false,
          closeIconName: undefined,
          urls,
          theme,
          imageBackgroundColor,
          initialIndex: 0,
          open: false,
          src: '',
          setOpen: noop,
          ids,
        }}
      >
        {children}
      </GaleriaContext.Provider>
    )
  },
  {
    Image({ edgeToEdge, ...props }: GaleriaViewProps) {
      const { theme, urls, imageBackgroundColor } = useContext(GaleriaContext)

      if (__DEV__) {
        // warn the user once about unnecessary defined prop
        controlEdgeToEdgeValues({ edgeToEdge })
      }

      return (
        <NativeImage
          onIndexChange={props.onIndexChange}
          edgeToEdge={EDGE_TO_EDGE || (edgeToEdge ?? false)}
          theme={theme}
          imageBackgroundColor={props.imageBackgroundColor ?? imageBackgroundColor}
          urls={urls?.map((url) => {
            if (typeof url === 'string') {
              return url
            }

            return Image.resolveAssetSource(url).uri
          })}
          {...props}
        />
      )
    },
    Popup: (() => null) as React.FC<{
      disableTransition?: 'web'
    }>,
  },
)

export default Galeria
