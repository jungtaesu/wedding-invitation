/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useEffect } from "react"
import { StoreContext } from "./context"
import { KAKAO_SDK_JS_KEY, NAVER_MAP_CLIENT_ID } from "../../env"

const baseUrl = import.meta.env.BASE_URL

const NAVER_MAP_URLS = [
  `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`,
  `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_MAP_CLIENT_ID}`,
]
const KAKAO_SDK_URL = `${baseUrl}/kakao_js_sdk/2.7.1/kakao.min.js`

export const useNaver = () => {
  const { naver, setNaver } = useContext(StoreContext)
  useEffect(() => {
    if (!NAVER_MAP_CLIENT_ID) {
      return
    }

    const hasLoadedScript = NAVER_MAP_URLS.some((src) =>
      document.querySelector(`script[src="${src}"]`),
    )

    if (!hasLoadedScript) {
      const loadScript = (index: number) => {
        const src = NAVER_MAP_URLS[index]
        if (!src) {
          return
        }

        const script = document.createElement("script")
        script.src = src
        script.addEventListener("load", () => {
          setNaver((window as any).naver)
        })
        script.addEventListener("error", () => {
          script.remove()
          loadScript(index + 1)
        })
        document.head.appendChild(script)
      }

      loadScript(0)
    }
  }, [setNaver])

  return naver
}

export const useKakao = () => {
  const { kakao, setKakao } = useContext(StoreContext)
  useEffect(() => {
    if (!KAKAO_SDK_JS_KEY) {
      return
    }

    if (!document.querySelector(`script[src="${KAKAO_SDK_URL}"]`)) {
      const script = document.createElement("script")
      script.addEventListener("load", () => {
        if (!(window as any).Kakao.isInitialized()) {
          ;(window as any).Kakao.init(KAKAO_SDK_JS_KEY)
        }
        setKakao((window as any).Kakao)
      })
      script.src = KAKAO_SDK_URL
      document.head.appendChild(script)
    }
  }, [setKakao])

  return kakao
}
