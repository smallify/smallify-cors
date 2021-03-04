import { Smallify } from 'smallify'
import { SmallifyCors, CorsOptions } from './types/options'

declare const cros: SmallifyCors

export = cros

declare module 'smallify' {
  interface SmallifyPlugin {
    (plugin: SmallifyCors, opts: CorsOptions): Smallify
  }
}
