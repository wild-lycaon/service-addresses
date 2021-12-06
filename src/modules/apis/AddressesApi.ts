/**
 * AddressesApi Module
 */
import request from 'request'
import zlib from 'zlib'

// const _endpoint = '//wild-lycaon.github.io/service-addresses/addresses/'
const _endpoint = 'http://localhost:8080/addresses/'

/**
 * get
 * @param   path
 * @return  Promise<object>
 */
export const get = async (path: string): Promise<any> => {
  const { BROTLI_PARAM_QUALITY, BROTLI_MAX_QUALITY } = zlib.constants
  const url = `${_endpoint}${path}`
  return new Promise((resolve) => {
    request({ encoding: null, url }, async (error, response, body) => {
      if (error) return resolve(null)
      if (response.statusCode !== 200) return resolve(null)
      const decompressed = await zlib.brotliDecompressSync(body, {
        params: { [BROTLI_PARAM_QUALITY]: BROTLI_MAX_QUALITY }
      })
      return resolve(JSON.parse(decompressed.toString()))
    })
  })
}
