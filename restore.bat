@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ----------------------------------------------------------------------------
REM 警告：
REM 此脚本将使用 `git show <object_id>` 命令，并将输出重定向到文本文件。
REM
REM - 对于 blob, 文件内容将被保存。
REM - 对于 tree, 你将看到 ls-tree 格式的输出，而不是文件内容。
REM - 对于 commit, 你将看到提交信息和该 commit 所代表的 tree。
REM
REM 请务必在运行此脚本前备份您的 Git 仓库！
REM ----------------------------------------------------------------------------

echo.
echo ======================================================
echo   Git Show Dangling Objects to Files Script
echo ======================================================
echo.
echo 正在准备将 dangling 对象内容导出到文件...
echo.

REM 确保当前目录是 Git 仓库的根目录
git rev-parse --is-inside-work-tree > nul
IF %ERRORLEVEL% NEQ 0 (
    echo 错误：当前目录不是一个 Git 仓库。请在 Git 仓库的根目录下运行此脚本。
    goto :end
)

echo.
echo 正在导出以下 dangling 对象内容...
echo.

REM ----------------------------------------------------------------------------
REM 定义所有 dangling 对象 ID
REM ----------------------------------------------------------------------------

set "all_dangling_objects="
set "all_dangling_objects=!all_dangling_objects! 113088ac85a88ac6483d34d182f61bc5fc10c82e"
set "all_dangling_objects=!all_dangling_objects! b1a0585d6cebce63c30e5884d055629b569e1a83"
set "all_dangling_objects=!all_dangling_objects! 08219f1c1f3727445604ee9b75e2ab4dd8b24da8"
set "all_dangling_objects=!all_dangling_objects! 37f1db689b5d5f2084a938687a54641de3cf9799"
set "all_dangling_objects=!all_dangling_objects! b271791d18a2d4c29163c13ade0507aa14e4e005"
set "all_dangling_objects=!all_dangling_objects! d921a625996ec09da88997116317ee32b0243ba1"
set "all_dangling_objects=!all_dangling_objects! 2852fe6e803a186094c96db85efbe21dda1d3b10"
set "all_dangling_objects=!all_dangling_objects! 4d62842b9d4a59679b9425668e7f5b81b6d05e97"
set "all_dangling_objects=!all_dangling_objects! 586223786b35d3cd726c38ff9a813395f11533fa"
set "all_dangling_objects=!all_dangling_objects! 63e2596d6a30eeb98f44476038d3decc5f2ded7f"
set "all_dangling_objects=!all_dangling_objects! 9322879c87f6ecf9f22c513e4e876c6ce81d6763"
set "all_dangling_objects=!all_dangling_objects! 92d2adedf74ac7f5f69c7980bcb165567ab2e932"
set "all_dangling_objects=!all_dangling_objects! 9d624ddcd39b8d121eaf1570fcb8800967bb87c5"
set "all_dangling_objects=!all_dangling_objects! e13224fbe892aa956644ed4b04b8859022b8f102"
set "all_dangling_objects=!all_dangling_objects! f4323290c061a0b4740042b69883e3a4d2b26bde"
set "all_dangling_objects=!all_dangling_objects! 41a36bbc23bbcb24aaa424d8807a90c4d7091857"
set "all_dangling_objects=!all_dangling_objects! 5d137a84e569866e8955c7fc44d10cbefaa47bab"
set "all_dangling_objects=!all_dangling_objects! c0a3b2c177da59b84687ea7e0679628344480cfc"
set "all_dangling_objects=!all_dangling_objects! dbb3cbf9d74cca2f47211f2065ce1b9a04e788ec"
set "all_dangling_objects=!all_dangling_objects! 2564a1297986a3d73e2c708852c2c65306e3a3ce"
set "all_dangling_objects=!all_dangling_objects! 9674c90542356a8ed5c7af1a3472fe8ecfe52a49"
set "all_dangling_objects=!all_dangling_objects! b374e85a5a31cff584ad18769e2ddde8927af32a"
set "all_dangling_objects=!all_dangling_objects! bde4b42314ea8f4a0f690d6cb0d8d50f1b4ecb03"
set "all_dangling_objects=!all_dangling_objects! 06d5293604bda580c4236b01b10f062bd8e3d780"
set "all_dangling_objects=!all_dangling_objects! 16651543916067b6d1b6cecf2bc34b74266b9e00"
set "all_dangling_objects=!all_dangling_objects! 30f5ef577881be31fac0ace4237cc20c17d35e4f"
set "all_dangling_objects=!all_dangling_objects! 467668fb0fe1741f12c26040478c32dc16464726"
set "all_dangling_objects=!all_dangling_objects! 6e86b2d79a71d39b2a9164eebab924d17630b74a"
set "all_dangling_objects=!all_dangling_objects! ae4605789a2249c52dacf5843e206f8df7c3cac4"
set "all_dangling_objects=!all_dangling_objects! 45f760e48d48fcccdfa554482366fb8d3d4ca60a"
set "all_dangling_objects=!all_dangling_objects! 475797726863d714acaff3be9f1dfc3c6493db1c"
set "all_dangling_objects=!all_dangling_objects! 44f7485445a602968619f57f411fba19bd8de740"
set "all_dangling_objects=!all_dangling_objects! 95d7bd5c15e4b49520e482f0248f957461589edf"
set "all_dangling_objects=!all_dangling_objects! b087a456e9548e6100bbd29b562e8d41828f2866"
set "all_dangling_objects=!all_dangling_objects! e7c85b153b780460d324ca4770289e0fbe6c1f1b"
set "all_dangling_objects=!all_dangling_objects! 30b95fb0d3627cf44e03b19524e11b4a841ae025"
set "all_dangling_objects=!all_dangling_objects! bb29affe09ab757c5823b7cd3408c34a2b638a7b"
set "all_dangling_objects=!all_dangling_objects! 169a2c90c18b41f03c6e2341b43f42d0c150198b"
set "all_dangling_objects=!all_dangling_objects! bcca583b8e0df2199048954c3ae4f8131d5c5513"
set "all_dangling_objects=!all_dangling_objects! 6cbb16a17c4ebdee764c4d9cf85c1c8965a68fb7"
set "all_dangling_objects=!all_dangling_objects! 936bf6fc738db01c07faf181512d379221349cc6"
set "all_dangling_objects=!all_dangling_objects! ab7b826ba8968a71c2aa6da9becda37da98a23d4"
set "all_dangling_objects=!all_dangling_objects! e11b2f431a1c35cf2bb09f11ac3e0cd41448626a"
set "all_dangling_objects=!all_dangling_objects! 87ac2cf2474d8aaa4ad63af68c4d7a87c8bb22bb"
set "all_dangling_objects=!all_dangling_objects! d4fccca8e9a466ee67c0c759dbdfb07e370fe8ba"
set "all_dangling_objects=!all_dangling_objects! ecfca679e3a23a35728dc5c6c97eb696f115c82b"
set "all_dangling_objects=!all_dangling_objects! f63cc623eb665af1f69fac4cc079ce3d8c02f0f8"
set "all_dangling_objects=!all_dangling_objects! 18fd9a28b3161862e85af581d6a3425f7a2157ae"
set "all_dangling_objects=!all_dangling_objects! 6aedc911b43e341c8af6bc7194f048e6ff0ad976"
set "all_dangling_objects=!all_dangling_objects! bbddb96953661f644cb4e4727bf6d7aae1779823"
set "all_dangling_objects=!all_dangling_objects! e13d96e255f8376546ba7b53e5edd3b013f83a33"
set "all_dangling_objects=!all_dangling_objects! 743ee9860d63f2a8c07eb042110319db1da3e8a7"
set "all_dangling_objects=!all_dangling_objects! cd6ecb346f2dc80c877965501e157abe29827279"
set "all_dangling_objects=!all_dangling_objects! efde7be0a13e72e63eac13ad9480eeba2ff23dc5"
set "all_dangling_objects=!all_dangling_objects! 05ff2156c5effd10000ef048e03d15e56c87094c"
set "all_dangling_objects=!all_dangling_objects! 288fe012fc12d5e5c0041fa1d1d534fced5f07e4"
set "all_dangling_objects=!all_dangling_objects! c6af19555e5c3680c2b17467584562b928604d8c"


REM ----------------------------------------------------------------------------
REM 遍历并执行 git show，重定向到文件
REM ----------------------------------------------------------------------------

FOR %%i IN (!all_dangling_objects!) DO (
    echo --- 正在导出对象 %%i ---
    git show %%i > %%i.txt
    IF !ERRORLEVEL! NEQ 0 (
        echo   警告：无法导出对象 %%i。可能已损坏或不存在。
    ) ELSE (
        echo   已导出到 %%i.txt
    )
)

echo.
echo ======================================================
echo   导出完成。
echo ======================================================
echo.
echo 请检查当前目录，您应该会找到以对象 ID 命名的 .txt 文件。
echo 再次提醒，请谨慎处理这些导出的文件，并确保您了解这些 dangling 对象的作用。

:end
pause
ENDLOCAL