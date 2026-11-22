import type { RouteObject } from 'react-router'
import { AgeGateScreen } from '@/features/onboarding/AgeGateScreen'
import { HomeScreen } from '@/features/home/HomeScreen'
import { MyDaresScreen } from '@/features/dares/MyDaresScreen'
import { PlayerEditorScreen } from '@/features/players/PlayerEditorScreen'
import { PlayersScreen } from '@/features/players/PlayersScreen'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { ComingSoonScreen } from './ComingSoonScreen'
import { RequireAge } from './RequireAge'
import { RootLayout } from './RootLayout'
import { TabsLayout } from './TabsLayout'

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      { path: '/bienvenue', element: <AgeGateScreen /> },
      {
        element: <RequireAge />,
        children: [
          {
            element: <TabsLayout />,
            children: [
              { index: true, element: <HomeScreen /> },
              { path: 'joueurs', element: <PlayersScreen /> },
              { path: 'defis', element: <MyDaresScreen /> },
              { path: 'profil', element: <ProfileScreen /> },
            ],
          },
          { path: 'joueurs/:playerId', element: <PlayerEditorScreen /> },
          { path: 'partie/nouvelle', element: <ComingSoonScreen /> },
          { path: 'partie', element: <ComingSoonScreen /> },
          { path: 'partie/recap', element: <ComingSoonScreen /> },
          { path: '*', element: <HomeScreen /> },
        ],
      },
    ],
  },
]
