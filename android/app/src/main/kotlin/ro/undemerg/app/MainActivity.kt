package ro.undemerg.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import ro.undemerg.app.ui.UndeMergApp
import ro.undemerg.app.ui.UndeMergTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            UndeMergTheme {
                UndeMergApp()
            }
        }
    }
}
