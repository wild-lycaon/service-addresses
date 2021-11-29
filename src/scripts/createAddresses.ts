/**
 * AddressesCreator Script
 * @see https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html
 * @see https://www.post.japanpost.jp/zipcode/dl/readme.html
 */
import fs from 'fs'
import iconv from 'iconv-lite'
import readline from 'readline'
import request from 'request'
const { unzip, zip } = require('zip-unzip-promise')

const _zip = 'ken_all.zip'
const _url = `https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/${_zip}`
const _out = 'docs/addresses'

console.log(`> target => [${_url}]`)
request({ encoding: null, url: _url }, async (error, response, body) => {
  if (!!error || response.statusCode !== 200) {
    console.log(`> failed => [${error}] [${response.statusCode}]`)
    return
  }
  const { csv, path } = await _getCsv({ body, zip: _zip })
  const { fromAddress, fromZip } = await _getJson({ csv, path })
  await _putJson({ fromAddress, fromZip, path: _out })
  console.log('> successed')
})

/**
 * _getCsv
 * @param   param
 * @return  Promise<any>
 */
const _getCsv = async (param: any): Promise<any> => {
  const { body, zip } = param

  // 一時ディレクトリの作成
  const path = fs.mkdtempSync('./temp.')
  fs.writeFileSync(`${path}/${zip}`, body, 'binary')

  // ダウンロードしたファイルを一時ディレクトリに解凍
  await unzip(`${path}/${zip}`, path)

  return { path, csv: zip.replace('.zip', '.csv').toUpperCase() }
}

/**
 * _getJson
 * @param   param
 * @return  Promise<any>
 */
const _getJson = async (param: any): Promise<any> => {
  const { path, csv } = param
  const fromAddress: any = {}
  const fromZip: any = {}

  // 解凍したファイルをJSON形式に変換
  const lineReadStream = readline.createInterface({
    input: fs
      .createReadStream(`${path}/${csv}`)
      .pipe(iconv.decodeStream('SJIS'))
      .pipe(iconv.encodeStream('UTF-8'))
  })
  for await (const line of lineReadStream) {
    const [, , zip, , , , pref, city, town] = line.replace(/"/g, '').split(',')
    const zip1 = zip.substr(0, 3)
    const zip2 = zip.substr(3)

    // 住所から郵便番号
    if (!fromAddress[pref]) {
      fromAddress[pref] = { [city]: { [town]: [{ zip, zip1, zip2 }] } }
    } else if (!fromAddress[pref][city]) {
      fromAddress[pref][city] = { [town]: [{ zip, zip1, zip2 }] }
    } else if (!fromAddress[pref][city][town]) {
      fromAddress[pref][city][town] = [{ zip, zip1, zip2 }]
    } else {
      fromAddress[pref][city][town].push({ zip, zip1, zip2 })
    }

    // 郵便番号から住所
    if (!fromZip[zip1]) {
      fromZip[zip1] = { [zip2]: [{ pref, city, town }] }
    } else if (!fromZip[zip1][zip2]) {
      fromZip[zip1][zip2] = [{ pref, city, town }]
    } else {
      fromZip[zip1][zip2].push({ pref, city, town })
    }
  }

  // 一時ディレクトリの削除
  fs.rmdirSync(path, { recursive: true })

  return { fromAddress, fromZip }
}

/**
 * _putJson
 * @param   param
 * @return  Promise<any>
 */
const _putJson = async (param: any): Promise<any> => {
  const { fromAddress, fromZip, path } = param
  const writer = async (path: string, file: string, data: any) => {
    const fileName = `${path}/${file}.json`
    fs.mkdirSync(path, { recursive: true })
    if (fs.existsSync(fileName)) {
      fs.unlinkSync(fileName)
    }
    fs.writeFileSync(fileName, JSON.stringify(data))
    await zip(fileName, fileName.replace('.json', '.zip'), {
      overwrite: true
    })
    fs.unlinkSync(fileName)
  }

  // 以前に作成したファイルを削除
  fs.rmdirSync(path, { recursive: true })

  // JSON形式のデータをファイルとして出力
  Object.keys(fromAddress).forEach((pref) => {
    writer(`${path}/fromAddress`, pref, fromAddress[pref])
  })
  Object.keys(fromZip).forEach((zip1) => {
    writer(`${path}/fromZip`, zip1, fromZip[zip1])
  })
}
