/**
 * AddressesApi Module
 */
import request from 'request'
import zlib from 'zlib'

// const _endpoint = '//wild-lycaon.github.io/service-addresses/addresses/'
const _endpoint = 'http://localhost:8080/addresses/'

export const get = async (path: string): Promise<any> => {
  const url = `${_endpoint}${path}`
  return new Promise((resolve, reject) => {
    request({ encoding: null, url }, async (error, response, body) => {
      if (!!error || response.statusCode !== 200) {
        reject({ error, statusCode: response.statusCode })
      }

      const { BROTLI_PARAM_QUALITY, BROTLI_MAX_QUALITY } = zlib.constants
      const compressed = await zlib.brotliDecompressSync(body, {
        params: { [BROTLI_PARAM_QUALITY]: BROTLI_MAX_QUALITY }
      })

      resolve(JSON.parse(compressed.toString()))
    })
  })
}
