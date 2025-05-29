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
// import { MantineLogo } from "@mantinex/mantine-logo";
import classes from "./HeaderSearch.module.css";
import { Link } from "react-router-dom";
import { IconSun, IconMoon } from "@tabler/icons-react";

const links = [
  { link: "/about", label: "Features" },
  { link: "/pricing", label: "Pricing" },
  { link: "/learn", label: "Learn" },
  { link: "/community", label: "Community" },
];

export function HeaderSearch() {
  const [opened, { toggle }] = useDisclosure(false);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const items = links.map((link) => (
    <a
      key={link.label}
      href={link.link}
      className={classes.link}
      onClick={(event) => event.preventDefault()}
    >
      {link.label}
    </a>
  ));

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          {/* <MantineLogo size={28} /> */}
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

          <Group ml={50} gap={5} className={classes.links} visibleFrom="sm">
            {items}
          </Group>
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
        </Group>
      </div>
    </header>
  );
}
