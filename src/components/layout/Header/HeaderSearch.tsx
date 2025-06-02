import { IconSearch } from "@tabler/icons-react";
import {
  ActionIcon,
  Autocomplete,
  Burger,
  Button,
  Group,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./HeaderSearch.module.css";
import { Link, useNavigate } from "react-router-dom";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useAuth } from "../../../context/authContext";
import { doSignOut } from "../../../firebase/auth";

export function HeaderSearch() {
  const [opened, { toggle }] = useDisclosure(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <Link to="/" className={classes.logoText}>
            MSFormFake
          </Link>
        </Group>

        <Group>
          <ActionIcon
            onClick={() => toggleColorScheme()}
            variant="outline"
            color={colorScheme === "dark" ? "violet" : "indigo"}
            size="lg"
          >
            {colorScheme === "dark" ? (
              <IconSun size={16} stroke={1.5} />
            ) : (
              <IconMoon size={16} stroke={1.5} />
            )}
          </ActionIcon>
          <Autocomplete
            className={classes.search}
            placeholder="Search"
            leftSection={<IconSearch size={16} stroke={1.5} />}
            data={[
              "React",
              "Angular",
              "Vue",
              "Next.js",
              "Riot.js",
              "Svelte",
              "Blitz.js",
            ]}
            visibleFrom="xs"
          />
          <Button
            onClick={() => {
              if (currentUser) {
                // Handle logout logic here
                doSignOut();
              } else {
                // Redirect to login page
                navigate("/login");
              }
            }}
            variant="outline"
            color="indigo"
          >
            {currentUser ? "Logout" : "Login"}
          </Button>
        </Group>
      </div>
    </header>
  );
}
