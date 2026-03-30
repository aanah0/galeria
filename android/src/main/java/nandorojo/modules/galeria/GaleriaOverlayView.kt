package nandorojo.modules.galeria

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.os.Handler
import android.os.Looper
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentActivity

class GaleriaOverlayView(context: Context) : FrameLayout(context) {

    private val containerView = object : FrameLayout(context) {
        override fun onInterceptTouchEvent(ev: MotionEvent?) = false
        override fun onTouchEvent(event: MotionEvent?) = false
    }

    private var addedToDialog = false
    private var originalParent: ViewGroup? = null

    var visible: Boolean = false
        set(value) {
            val changed = field != value
            field = value
            if (changed) {
                if (value) showOverlay() else hideOverlay()
            }
        }

    init {
        addView(containerView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }

    override fun addView(child: View?, index: Int, params: ViewGroup.LayoutParams?) {
        if (child === containerView) {
            super.addView(child, index, params)
        } else {
            containerView.addView(child, params)
        }
    }

    override fun removeView(view: View?) {
        if (view != null && view.parent === containerView) {
            containerView.removeView(view)
        } else {
            super.removeView(view)
        }
    }

    private fun showOverlay() {
        val activity = getActivity(context) as? FragmentActivity ?: return
        Handler(Looper.getMainLooper()).post {
            tryAttachToDialog(activity)
        }
    }

    private fun tryAttachToDialog(activity: FragmentActivity) {
        if (addedToDialog) return
        val fragment = activity.supportFragmentManager.fragments
            .filterIsInstance<DialogFragment>()
            .lastOrNull { it.dialog?.isShowing == true }

        val dialogContentView = fragment?.dialog?.window?.decorView
            ?.findViewById<ViewGroup>(android.R.id.content)

        if (dialogContentView != null) {
            originalParent = containerView.parent as? ViewGroup
            originalParent?.removeView(containerView)
            dialogContentView.addView(
                containerView,
                LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            )
            addedToDialog = true
        } else {
            // Dialog not ready yet, retry
            Handler(Looper.getMainLooper()).postDelayed({
                if (visible && !addedToDialog) {
                    tryAttachToDialog(activity)
                }
            }, 50)
        }
    }

    private fun hideOverlay() {
        if (addedToDialog) {
            (containerView.parent as? ViewGroup)?.removeView(containerView)
            addView(containerView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            addedToDialog = false
        }
    }

    private fun getActivity(context: Context): Activity? {
        var ctx = context
        while (ctx is ContextWrapper) {
            if (ctx is Activity) {
                return ctx
            }
            ctx = ctx.baseContext
        }
        return null
    }

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        for (i in 0 until childCount) {
            val child = getChildAt(i)
            child.layout(0, 0, r - l, b - t)
        }
    }
}
