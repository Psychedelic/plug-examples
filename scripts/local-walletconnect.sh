#$/bin/bash

rootdir="$PWD"
modulesdir="$PWD/local-modules"
plugconnectdir="$PWD/local-modules/plug-connect"
pluginpageproviderdir="$PWD/local-modules/plug-inpage-provider"

[ ! -d "$modulesdir" ] && mkdir -p "$modulesdir" && echo "[LOCAL MODULES DIR CREATED]"

cd "$modulesdir"

[ ! -d "$pluginpageproviderdir" ] && git clone git@github.com:Psychedelic/plug-inpage-provider.git && echo "[PLUG-INPAGE-PROVIDER CLONED]"

cd "$pluginpageproviderdir"

git checkout feat/wallet-connect-rpc

yarn install && echo "[PLUG-INPAGE-PROVIDER INSTALLED]"

yarn build && echo "[PLUG-INPAGE-PROVIDER BUILT]"

cd "$modulesdir"

[ ! -d "$plugconnectdir" ] && git clone git@github.com:Psychedelic/plug-connect.git && echo "[PLUG-CONNECT CLONED]"

cd "$plugconnectdir"

git checkout feat/wallet-connect

yarn install && echo "[PLUG-CONNECT INSTALLED]"

yarn add "$pluginpageproviderdir"

yarn build && echo "[PLUG-CONNECT BUILT]"


echo "$rootdir"
cd "$rootdir"

yarn add "$plugconnectdir"

