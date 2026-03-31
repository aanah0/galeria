import Foundation
import UIKit
#if canImport(SDWebImage)
import SDWebImage
#endif

public protocol ImageLoadTask {
    func cancel()
}

public protocol ImageLoader {
    @discardableResult
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (_ image: UIImage?) -> Void) -> ImageLoadTask
}

extension ImageLoader {
    @discardableResult
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, completion: @escaping (_ image: UIImage?) -> Void) -> ImageLoadTask {
        loadImage(
            url,
            placeholder: placeholder,
            imageView: imageView,
            disableCache: false,
            completion: completion
        )
    }
}

public struct URLSessionImageLoader: ImageLoader {
    public init() {}

    public func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (UIImage?) -> Void) -> ImageLoadTask {
        if let placeholder = placeholder {
            imageView.image = placeholder
        }

        let request = URLRequest(url: url, cachePolicy: disableCache ? .reloadIgnoringLocalCacheData : .useProtocolCachePolicy)
        let task = URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error as? URLError, error.code == .cancelled {
                return
            }

            guard let data = data, let image = UIImage(data: data) else {
                DispatchQueue.main.async { completion(nil) }
                return
            }
            DispatchQueue.main.async {
                imageView.image = image
                completion(image)
            }
        }

        task.resume()
        return URLSessionImageLoadTask(task: task)
    }
}

private final class URLSessionImageLoadTask: ImageLoadTask {
    private var task: URLSessionDataTask?

    init(task: URLSessionDataTask?) {
        self.task = task
    }

    func cancel() {
        task?.cancel()
        task = nil
    }
}

#if canImport(SDWebImage)
struct SDWebImageLoader: ImageLoader {
    func loadImage(_ url: URL, placeholder: UIImage?, imageView: UIImageView, disableCache: Bool, completion: @escaping (UIImage?) -> Void) -> ImageLoadTask {
        let options: SDWebImageOptions = disableCache ? [.refreshCached, .fromLoaderOnly] : []
        let operation = imageView.sd_setImage(
            with: url,
            placeholderImage: placeholder,
            options: options,
            progress: nil) {(img, err, type, url) in
                DispatchQueue.main.async {
                    completion(img)
                }
        }

        return SDWebImageImageLoadTask(imageView: imageView, operation: operation)
    }
}

private final class SDWebImageImageLoadTask: ImageLoadTask {
    private weak var imageView: UIImageView?
    private var operation: SDWebImageOperation?

    init(imageView: UIImageView, operation: SDWebImageOperation?) {
        self.imageView = imageView
        self.operation = operation
    }

    func cancel() {
        operation?.cancel()
        imageView?.sd_cancelCurrentImageLoad()
        operation = nil
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
