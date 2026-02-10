# What NPX does?

    Searches for a file and executes it.

## Search Step - 1

- Searches for `package.json` in **current working directory.**
- Searches for the `name` key the **json**.
- Searches for the `bin` key after find `name`

```json
{
  "name": "hello",
  "bin": "app.xyz"
}
```

## Search Step - 2

-Searches for `node_modules\.bin\hello` here hello is package name, in current working directory and executes this.

#### some points :

- when initially we run :

```bash
 npx hello
```

output:

```bash
'hello' is not recognized as an internal or external command,
operable program or batch file.
```

this error appears because current `npm script shell` is `cmd` in `Windows` By default.

- How to check:

```bash
 npm config get script-shell
```

- output: 

```bash
null
```
- How to set `bash` as `npm shell script` :
```bash
npm config set script-shell "C:\Program Files\Git\usr\bin\bash"
```

- Now it working.
```bash
npx hello
```
- Output : 
```bash
Hii, i am hello...
```

## Search Step - 3
- Searches for `hello` in globally (`npm root -g`).

## Search Step - 4
- Searches for `hello` package on `npx-cache > _npx`

## Search Step - 5
- Searches for `hello` package on npm registry.
- Prompts to install (if found this cli package)
- Downloads and install this package.
- And store at `npx-cache > _npx`
