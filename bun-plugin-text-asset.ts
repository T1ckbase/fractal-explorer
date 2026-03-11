import { type BunPlugin } from 'bun';

/**
 * WORKAROUND: In Bun v1.3.10, .wgsl assets consistently fail to update via HMR,
 * and changes don't apply even after a page refresh.
 * This plugin ensures shader changes take effect without needing to restart the dev server.
 */

export default {
  name: 'text-asset',
  setup(build) {
    build.onLoad({ filter: /\.wgsl$/ }, async (args) => {
      return {
        loader: 'text',
        contents: await Bun.file(args.path).text(),
      };
    });
  },
} satisfies BunPlugin;
