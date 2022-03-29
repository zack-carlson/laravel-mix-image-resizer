const mix = require('laravel-mix')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')
const sharp = require('sharp')
const imageSize = require('image-size')
const imagemin = require('imagemin')
const imageminJpegtran = require('imagemin-jpegtran')
const imageminPngquant = require('imagemin-pngquant')
const imageminWebp = require('imagemin-webp')

const defaultOptions = {
    disable: false,
    from: 'resources',
    to: 'public',
    sizes: [
        414,
        768,
        828,
        1024,
        1280,
        1536,
        1600
    ],
    fractionalRatios: [
        1,2,3,4
    ],
    webp: true,
    imageminPngquantOptions: {
        quality: [0.3, 0.5]
    },
    imageminWebpOptions: {
        quality: 50
    },
    useFractions: true,
}

class ImageResizer {
    register(extraOptions = {}) {
        const {
            disable,
            sizes,
            from,
            to,
            webp,
            imageminPngquantOptions,
            imageminWebpOptions,
            fractionalRatios,
            useFractions,
        } = Object.assign(defaultOptions, extraOptions)

        if (disable) return

        sizes.sort((a, b) => {
            if (a > b) {
                return 1
            } else {
                return -1
            }
        })
        fs.copySync(from, to)
        const images = glob.sync(to + '/**/*').forEach((imagePath) => {
            if (imagePath.match(/\.(jpe?g|png|gif)$/i) === null) {
                return
            }

            let {root, dir, base, ext, name} = path.parse(imagePath)
            let width = imageSize(imagePath).width
            if (useFractions) {
                split_name = filename.match(/(.*)@([1-5])x/);
                if (split_name == null) { 
                    return 
                }
                thisSize = split_name[2];
                rootName = split_name[1];

                fractionalRatios.forEach((scale) => {
                    if (thisSize < scale) { 
                        // don't upscale
                        return
                    } 
                    
                    ratio = thisSize / scale;
                    newWidth = Math.floor(ratio * width);

                    sharp(imagePath)
                        .resize(newWidth)
                        .toFile(dir + '/' + name + '@' + scale + 'x' + ext);
                    imagemin([imagePath, dir + '/' + name + '@*'], {
                        destination: dir,
                        plugins: [
                            imageminJpegtran(),
                            imageminPngquant(imageminPngquantOptions),
                        ],
                    });
                })

            } else { 
                sizes.forEach((w) => {
                    if (width < w) {
                        return
                    }
                    sharp(imagePath)
                        .resize(w)
                        .toFile(dir + '/' + name + '-resized-' + w + ext)
                })
                imagemin([imagePath, dir + '/' + name + '-resized-*'], {
                    destination: dir,
                    plugins: [
                        imageminJpegtran(),
                        imageminPngquant(imageminPngquantOptions),
                    ],
                });
                if (webp) {
                    imagemin([imagePath, dir + '/' + name + '-resized-*'], {
                        destination: dir,
                        plugins: [
                            imageminWebp(imageminWebpOptions)
                        ],
                    })
                }
            }
            

            
        })
    }
}

mix.extend('ImageResizer', new ImageResizer())