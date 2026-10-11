# Billentyu-injektalo: a server.js inditja, stdin-rol olvas sorokat.
# Sor formatum: "<tartas_ms> <scancode>:<extended>[:<vk>],<scancode>:<extended>[:<vk>],..."
# Ha van vk (virtualis kod), akkor a vk-t es a scancode-ot egyutt kuldjuk (az "extra" billentyuk).
# Scancode-ot kuldunk (nem virtualis kodot), mert a jatekok tobbsege azt figyeli.

$src = @'
using System;
using System.Runtime.InteropServices;
using System.Threading;

public static class Kb {
    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT { public int dx; public int dy; public uint mouseData; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }

    [StructLayout(LayoutKind.Sequential)]
    struct KEYBDINPUT { public ushort wVk; public ushort wScan; public uint dwFlags; public uint time; public IntPtr dwExtraInfo; }

    [StructLayout(LayoutKind.Explicit)]
    struct InputUnion {
        [FieldOffset(0)] public MOUSEINPUT mi;
        [FieldOffset(0)] public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct INPUT { public uint type; public InputUnion u; }

    [DllImport("user32.dll", SetLastError = true)]
    static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    const uint KEYEVENTF_EXTENDEDKEY = 0x1, KEYEVENTF_KEYUP = 0x2, KEYEVENTF_SCANCODE = 0x8;

    static void Key(ushort scan, bool ext, ushort vk, bool up) {
        INPUT[] inp = new INPUT[1];
        inp[0].type = 1;
        if (vk != 0) {
            inp[0].u.ki.wVk = vk;
            inp[0].u.ki.wScan = scan;
            inp[0].u.ki.dwFlags = (ext ? KEYEVENTF_EXTENDEDKEY : 0) | (up ? KEYEVENTF_KEYUP : 0);
        } else {
            inp[0].u.ki.wScan = scan;
            inp[0].u.ki.dwFlags = KEYEVENTF_SCANCODE | (ext ? KEYEVENTF_EXTENDEDKEY : 0) | (up ? KEYEVENTF_KEYUP : 0);
        }
        if (SendInput(1, inp, Marshal.SizeOf(typeof(INPUT))) == 0)
            Console.Error.WriteLine("SendInput hiba: " + Marshal.GetLastWin32Error());
    }

    // lenyomja sorban, var, majd forditott sorrendben felengedi
    public static void Combo(string spec, int holdMs) {
        string[] parts = spec.Split(',');
        ushort[] scan = new ushort[parts.Length];
        bool[] ext = new bool[parts.Length];
        ushort[] vk = new ushort[parts.Length];
        for (int i = 0; i < parts.Length; i++) {
            string[] p = parts[i].Split(':');
            scan[i] = ushort.Parse(p[0]);
            ext[i] = p[1] == "1";
            vk[i] = p.Length > 2 ? ushort.Parse(p[2]) : (ushort)0;
        }
        for (int i = 0; i < scan.Length; i++) { Key(scan[i], ext[i], vk[i], false); Thread.Sleep(8); }
        Thread.Sleep(holdMs);
        for (int i = scan.Length - 1; i >= 0; i--) { Key(scan[i], ext[i], vk[i], true); Thread.Sleep(8); }
    }
}
'@

Add-Type -TypeDefinition $src
[Console]::Out.WriteLine('ready')

while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    $p = $line.Trim().Split(' ')
    if ($p.Length -ne 2) { continue }
    try {
        [Kb]::Combo($p[1], [int]$p[0])
    } catch {
        [Console]::Error.WriteLine($_.Exception.Message)
    }
}
