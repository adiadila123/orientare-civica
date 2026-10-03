package ro.undemerg.app.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import kotlinx.serialization.Serializable

@Serializable object TriageRoute
@Serializable object InstitutionsRoute
@Serializable object MapRoute
@Serializable object RecordsRoute
@Serializable data class InstitutionRoute(val code: String)
@Serializable data class RecordRoute(val id: String)

private data class Tab(val route: Any, val label: String, val icon: ImageVector, val routeClass: kotlin.reflect.KClass<*>)

private val tabs = listOf(
    Tab(TriageRoute, "Triaj", Icons.Filled.Home, TriageRoute::class),
    Tab(InstitutionsRoute, "Instituții", Icons.Filled.AccountBalance, InstitutionsRoute::class),
    Tab(MapRoute, "Hartă", Icons.Filled.Map, MapRoute::class),
    Tab(RecordsRoute, "Dosare", Icons.Filled.FolderOpen, RecordsRoute::class),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UndeMergApp(vm: AppViewModel = viewModel()) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val destination = backStack?.destination

    val openInstitution: (String) -> Unit = { nav.navigate(InstitutionRoute(it)) }

    // Ecranele de detaliu nu sunt taburi: au bară de sus cu buton de întoarcere.
    val detailTitle = when {
        destination?.hasRoute<InstitutionRoute>() == true -> "Instituție"
        destination?.hasRoute<RecordRoute>() == true -> "Analiză salvată"
        else -> null
    }

    Scaffold(
        topBar = {
            if (detailTitle != null) {
                TopAppBar(
                    title = { Text(detailTitle, style = MaterialTheme.typography.titleMedium) },
                    navigationIcon = {
                        IconButton(onClick = { nav.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Înapoi")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface),
                )
            }
        },
        bottomBar = {
            NavigationBar {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        selected = destination?.hierarchy?.any { it.hasRoute(tab.routeClass) } == true,
                        onClick = {
                            nav.navigate(tab.route) {
                                popUpToStartDestination(nav)
                                launchSingleTop = true
                            }
                        },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) },
                    )
                }
            }
        },
    ) { padding ->
        NavHost(nav, startDestination = TriageRoute, modifier = Modifier.padding(padding)) {
            composable<TriageRoute> { TriageScreen(vm, openInstitution) }
            composable<InstitutionsRoute> { InstitutionsScreen(vm, openInstitution) }
            composable<MapRoute> { MapScreen(vm, openInstitution) }
            composable<RecordsRoute> { RecordsScreen(vm) { nav.navigate(RecordRoute(it)) } }
            composable<InstitutionRoute> { entry ->
                InstitutionDetailScreen(vm, entry.toRoute<InstitutionRoute>().code)
            }
            composable<RecordRoute> { entry ->
                RecordDetailScreen(vm, entry.toRoute<RecordRoute>().id, openInstitution)
            }
        }
    }
}

private fun androidx.navigation.NavOptionsBuilder.popUpToStartDestination(nav: androidx.navigation.NavController) {
    popUpTo(nav.graph.startDestinationId) { saveState = true }
    restoreState = true
}
