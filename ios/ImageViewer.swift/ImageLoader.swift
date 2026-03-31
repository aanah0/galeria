import Foundation
#if canImport(SDWebImage)
import SDWebImage
#endif

public protocol ImageLoader {
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (_ image: UIImage?) -> Void)
}

extension ImageLoader {
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, completion: @escaping (_ image: UIImage?) -> Void) {
        loadImage(url, placeholder: placeholder, imageView: imageView, disableCache: false, completion: completion)
    }
}

public struct URLSessionImageLoader: ImageLoader {
    public init() {}

    public func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (UIImage?) -> Void) {
        if let placeholder = placeholder {
            imageView.image = placeholder
        }

        let request = URLRequest(url: url, cachePolicy: disableCache ? .reloadIgnoringLocalCacheData : .useProtocolCachePolicy)
        URLSession.shared.dataTask(with: request) { data, _, _ in
            guard let data = data, let image = UIImage(data: data) else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            DispatchQueue.main.async {
                imageView.image = image
                completion(image)
            }
        }.resume()
    }
}

#if canImport(SDWebImage)
struct SDWebImageLoader: ImageLoader {
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (UIImage?) -> Void) {
        let options: SDWebImageOptions = disableCache ? [.refreshCached, .fromLoaderOnly] : []
        imageView.sd_setImage(
            with: url,
            placeholderImage: placeholder,
            options: options,
            progress: nil) {(img, err, type, url) in
                DispatchQueue.main.async {
                    completion(img)
                }
        }
    }
}
#endif


public struct ImageLoaderFactory {
    public static func makeDefault() -> ImageLoader {
        #if canImport(SDWebImage)
        return SDWebImageLoader()
        #else
        return URLSessionImageLoader()
        #endif
    }
}