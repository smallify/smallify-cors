import { Smallify, PluginOptions, Methods } from 'smallify'

export class CorsOptions extends PluginOptions {
  origin?: string | RegExp | Array<string | RegExp>
  credentials?: boolean
  methods?: Array<Methods>
  headers?: Array<string>
  exposedHeaders?: Array<string>
  maxAge?: number
}

export type SmallifyCors = {
  (smallify: Smallify, opts: CorsOptions): Promise<void>
}
